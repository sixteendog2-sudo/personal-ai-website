import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { adminAuditLogs, modelSettings, ownerProfiles, promptTemplates } from "@/db/schema";
import { env } from "@/lib/config";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

type Actor = { ownerId: string; adminUserId: string; ipHash: string };

export async function getOwnerProfile(ownerId = DEFAULT_OWNER_ID) {
  const [profile] = await getDatabase().select().from(ownerProfiles).where(eq(ownerProfiles.ownerId, ownerId)).limit(1);
  return profile ?? null;
}

export async function updateOwnerProfile(actor: Actor, input: Partial<typeof ownerProfiles.$inferInsert>) {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(ownerProfiles).where(eq(ownerProfiles.ownerId, actor.ownerId)).limit(1);
    if (!before) return null;
    const [profile] = await tx.update(ownerProfiles).set({ ...input, ownerId: actor.ownerId, updatedAt: new Date() })
      .where(eq(ownerProfiles.ownerId, actor.ownerId)).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "profile.update",
      resourceType: "owner_profile", resourceId: actor.ownerId, changes: { before, after: profile }, ipHash: actor.ipHash
    });
    return profile;
  });
}

export async function listModelSettings(ownerId: string) {
  const rows = await getDatabase().select().from(modelSettings).where(eq(modelSettings.ownerId, ownerId)).orderBy(desc(modelSettings.updatedAt));
  return rows.map(({ apiKeyEncrypted: _secret, ...row }) => ({ ...row, hasApiKey: Boolean(_secret) }));
}

export async function activateModelSetting(actor: Actor, input: {
  provider: string;
  baseUrl: string;
  model: string;
  temperatureMilli: number;
  maxTokens: number;
  apiKey?: string;
  keepExistingApiKey?: boolean;
}) {
  return getDatabase().transaction(async (tx) => {
    const [active] = await tx.select().from(modelSettings).where(and(
      eq(modelSettings.ownerId, actor.ownerId), eq(modelSettings.isActive, true)
    )).orderBy(desc(modelSettings.updatedAt)).limit(1);
    await tx.update(modelSettings).set({ isActive: false, updatedAt: new Date() }).where(eq(modelSettings.ownerId, actor.ownerId));
    const apiKeyEncrypted = input.apiKey
      ? encryptSecret(input.apiKey)
      : input.keepExistingApiKey ? active?.apiKeyEncrypted : null;
    const apiKeyLastFour = input.apiKey
      ? input.apiKey.slice(-4)
      : input.keepExistingApiKey ? active?.apiKeyLastFour : null;
    const [setting] = await tx.insert(modelSettings).values({
      ownerId: actor.ownerId,
      provider: input.provider,
      baseUrl: input.baseUrl,
      model: input.model,
      temperatureMilli: input.temperatureMilli,
      maxTokens: input.maxTokens,
      apiKeyEncrypted,
      apiKeyLastFour,
      isActive: true
    }).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "model.activate",
      resourceType: "model_setting", resourceId: setting.id,
      changes: { provider: setting.provider, model: setting.model, baseUrl: setting.baseUrl }, ipHash: actor.ipHash
    });
    const { apiKeyEncrypted: _secret, ...safeSetting } = setting;
    return { ...safeSetting, hasApiKey: Boolean(_secret) };
  });
}

export async function listPromptTemplates(ownerId: string) {
  return getDatabase().select().from(promptTemplates).where(eq(promptTemplates.ownerId, ownerId))
    .orderBy(desc(promptTemplates.createdAt));
}

export async function publishPromptTemplate(actor: Actor, input: { name: string; scene: string; systemPrompt: string; safetyPrompt: string }) {
  return getDatabase().transaction(async (tx) => {
    const [latest] = await tx.select().from(promptTemplates).where(and(
      eq(promptTemplates.ownerId, actor.ownerId), eq(promptTemplates.scene, input.scene)
    )).orderBy(desc(promptTemplates.version)).limit(1);
    await tx.update(promptTemplates).set({ isActive: false, updatedAt: new Date() }).where(and(
      eq(promptTemplates.ownerId, actor.ownerId), eq(promptTemplates.scene, input.scene)
    ));
    const [template] = await tx.insert(promptTemplates).values({
      ownerId: actor.ownerId, ...input, version: (latest?.version ?? 0) + 1, isActive: true
    }).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "prompt.publish",
      resourceType: "prompt_template", resourceId: template.id,
      changes: { name: template.name, scene: template.scene, version: template.version }, ipHash: actor.ipHash
    });
    return template;
  });
}

export async function getAiRuntimeSettings(scene: string) {
  const db = getDatabase();
  const [[model], [scenePrompt], [defaultPrompt]] = await Promise.all([
    db.select().from(modelSettings).where(and(eq(modelSettings.ownerId, DEFAULT_OWNER_ID), eq(modelSettings.isActive, true))).orderBy(desc(modelSettings.updatedAt)).limit(1),
    db.select().from(promptTemplates).where(and(eq(promptTemplates.ownerId, DEFAULT_OWNER_ID), eq(promptTemplates.scene, scene), eq(promptTemplates.isActive, true))).orderBy(desc(promptTemplates.version)).limit(1),
    db.select().from(promptTemplates).where(and(eq(promptTemplates.ownerId, DEFAULT_OWNER_ID), eq(promptTemplates.scene, "default"), eq(promptTemplates.isActive, true))).orderBy(desc(promptTemplates.version)).limit(1)
  ]);
  const prompt = scenePrompt ?? defaultPrompt;
  return {
    provider: model?.provider ?? "deepseek",
    baseUrl: model?.baseUrl ?? env.DEEPSEEK_BASE_URL,
    model: model?.model ?? env.DEEPSEEK_CHAT_MODEL,
    apiKey: model?.apiKeyEncrypted ? decryptSecret(model.apiKeyEncrypted) : undefined,
    temperature: (model?.temperatureMilli ?? 700) / 1000,
    maxTokens: model?.maxTokens ?? 1200,
    systemPrompt: prompt?.systemPrompt,
    safetyPrompt: prompt?.safetyPrompt
  };
}
