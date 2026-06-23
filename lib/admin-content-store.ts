import { and, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getDatabase } from "@/db/client";
import { adminAuditLogs, contentItems, contentMedia, knowledgeChunks, knowledgeItems, mediaAssets } from "@/db/schema";
import { chunkKnowledgeText, estimateTokenCount } from "@/lib/knowledge-chunks";

export type ContentWriteInput = {
  type: "life" | "study" | "work";
  title: string;
  summary?: string | null;
  body: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private" | "unlisted";
  happenedAt?: Date | null;
  metadata: Record<string, unknown>;
};

type AuditActor = { ownerId: string; adminUserId: string; ipHash: string };

export async function listAdminContent(ownerId: string, filters: { type?: string; status?: string }) {
  const conditions = [eq(contentItems.ownerId, ownerId)];
  if (filters.type) conditions.push(eq(contentItems.type, filters.type));
  if (filters.status === "draft" || filters.status === "published" || filters.status === "archived") {
    conditions.push(eq(contentItems.status, filters.status));
  }
  const db = getDatabase();
  const items = await db.select().from(contentItems).where(and(...conditions)).orderBy(desc(contentItems.updatedAt));
  if (items.length === 0) return [];
  const links = await db.select().from(contentMedia).where(inArray(contentMedia.contentId, items.map((item) => item.id)));
  const assets = await db.select().from(mediaAssets).where(eq(mediaAssets.ownerId, ownerId));
  return items.map((item) => ({
    ...item,
    media: links.filter((link) => link.contentId === item.id).sort((a, b) => a.sortOrder - b.sortOrder).map((link) => {
      const original = assets.find((asset) => asset.id === link.mediaId);
      const thumbnail = assets.find((asset) => asset.parentAssetId === link.mediaId) ?? null;
      return original ? { ...original, thumbnail, sortOrder: link.sortOrder } : null;
    }).filter(Boolean)
  }));
}

export async function getAdminContent(ownerId: string, id: string) {
  const [item] = await getDatabase().select().from(contentItems)
    .where(and(eq(contentItems.id, id), eq(contentItems.ownerId, ownerId))).limit(1);
  return item ?? null;
}

export async function createAdminContent(actor: AuditActor, input: ContentWriteInput) {
  return getDatabase().transaction(async (tx) => {
    const id = randomUUID();
    const [item] = await tx.insert(contentItems).values({
      id,
      ownerId: actor.ownerId,
      slug: id,
      ...input,
      publishedAt: input.status === "published" ? new Date() : null
    }).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "content.create",
      resourceType: "content_item", resourceId: item.id, changes: { after: item }, ipHash: actor.ipHash
    });
    await syncContentKnowledge(tx, item);
    return item;
  });
}

export async function updateAdminContent(actor: AuditActor, id: string, input: Partial<ContentWriteInput>) {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(contentItems)
      .where(and(eq(contentItems.id, id), eq(contentItems.ownerId, actor.ownerId))).limit(1);
    if (!before) return null;

    const [item] = await tx.update(contentItems).set({
      ...input,
      publishedAt: input.status === "published" && !before.publishedAt ? new Date() : before.publishedAt,
      updatedAt: new Date()
    }).where(and(eq(contentItems.id, id), eq(contentItems.ownerId, actor.ownerId))).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "content.update",
      resourceType: "content_item", resourceId: id, changes: { before, after: item }, ipHash: actor.ipHash
    });
    await syncContentKnowledge(tx, item);
    return item;
  });
}

export async function archiveAdminContent(actor: AuditActor, id: string) {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(contentItems)
      .where(and(eq(contentItems.id, id), eq(contentItems.ownerId, actor.ownerId))).limit(1);
    if (!before) return null;
    const [item] = await tx.update(contentItems).set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(contentItems.id, id), eq(contentItems.ownerId, actor.ownerId))).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "content.archive",
      resourceType: "content_item", resourceId: id, changes: { before, after: item }, ipHash: actor.ipHash
    });
    return item;
  });
}

function contentKnowledgeText(item: typeof contentItems.$inferSelect) {
  const metadata = item.metadata;
  const common = [item.title, item.summary, item.body];
  const fields = item.type === "life"
    ? [metadata.location, metadata.mood, ...(Array.isArray(metadata.tags) ? metadata.tags : [])]
    : item.type === "study"
      ? [metadata.studyType, metadata.period, metadata.institution, ...(Array.isArray(metadata.tags) ? metadata.tags : [])]
      : [metadata.role, metadata.result, metadata.period, ...(Array.isArray(metadata.techStack) ? metadata.techStack : []), ...(Array.isArray(metadata.tags) ? metadata.tags : [])];
  return [...common, ...fields].filter((value): value is string => typeof value === "string" && value.trim().length > 0).join("\n\n");
}

function sourceTypeFor(type: string) {
  if (type === "life") return "life_record";
  if (type === "study") return "study_item";
  return "work_project";
}

async function syncContentKnowledge(tx: any, item: typeof contentItems.$inferSelect) {
  const sourceType = sourceTypeFor(item.type);
  let [existing] = await tx.select().from(knowledgeItems).where(and(
    eq(knowledgeItems.ownerId, item.ownerId),
    eq(knowledgeItems.sourceType, sourceType),
    eq(knowledgeItems.sourceId, item.id)
  )).limit(1);
  if (!existing) {
    [existing] = await tx.select().from(knowledgeItems).where(and(
      eq(knowledgeItems.ownerId, item.ownerId),
      eq(knowledgeItems.sourceType, sourceType),
      eq(knowledgeItems.title, item.title)
    )).limit(1);
  }
  const text = contentKnowledgeText(item);
  const isAiUsable = item.status === "published" && item.visibility === "public" && item.metadata.isAiUsable === true;
  const values = {
    ownerId: item.ownerId,
    sourceType,
    sourceId: item.id,
    title: item.title,
    category: item.type === "life" ? "生活记录" : item.type === "study" ? "学习经历" : "项目经验",
    body: text,
    tags: Array.isArray(item.metadata.tags) ? item.metadata.tags.filter((tag): tag is string => typeof tag === "string") : [],
    status: item.status,
    visibility: item.visibility,
    isAiUsable,
    updatedAt: new Date()
  } as const;
  const [knowledge] = existing
    ? await tx.update(knowledgeItems).set(values).where(eq(knowledgeItems.id, existing.id)).returning()
    : await tx.insert(knowledgeItems).values(values).returning();
  await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.knowledgeItemId, knowledge.id));
  const chunks = chunkKnowledgeText(text);
  if (chunks.length > 0) {
    await tx.insert(knowledgeChunks).values(chunks.map((content, chunkIndex) => ({
      knowledgeItemId: knowledge.id,
      chunkIndex,
      content,
      tokenCount: estimateTokenCount(content)
    })));
  }
}

export async function syncAllContentKnowledge(ownerId: string) {
  return getDatabase().transaction(async (tx) => {
    const items = await tx.select().from(contentItems).where(eq(contentItems.ownerId, ownerId));
    for (const item of items) await syncContentKnowledge(tx, item);
    return items.length;
  });
}

export async function deleteAdminContent(actor: AuditActor, id: string) {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(contentItems)
      .where(and(eq(contentItems.id, id), eq(contentItems.ownerId, actor.ownerId))).limit(1);
    if (!before) return null;
    const mediaLinks = await tx.select({ mediaId: contentMedia.mediaId }).from(contentMedia).where(eq(contentMedia.contentId, id));
    await tx.delete(knowledgeItems).where(and(
      eq(knowledgeItems.ownerId, actor.ownerId),
      eq(knowledgeItems.sourceType, sourceTypeFor(before.type)),
      eq(knowledgeItems.sourceId, id)
    ));
    const [deleted] = await tx.delete(contentItems).where(and(
      eq(contentItems.id, id), eq(contentItems.ownerId, actor.ownerId)
    )).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "content.delete",
      resourceType: "content_item", resourceId: id, changes: { before }, ipHash: actor.ipHash
    });
    return { ...deleted, detachedMediaIds: mediaLinks.map((link) => link.mediaId) };
  });
}
