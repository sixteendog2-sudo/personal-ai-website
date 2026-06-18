import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { adminAuditLogs, contentItems } from "@/db/schema";

export type ContentWriteInput = {
  type: "life" | "study" | "work";
  slug: string;
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
  return getDatabase().select().from(contentItems).where(and(...conditions)).orderBy(desc(contentItems.updatedAt));
}

export async function getAdminContent(ownerId: string, id: string) {
  const [item] = await getDatabase().select().from(contentItems)
    .where(and(eq(contentItems.id, id), eq(contentItems.ownerId, ownerId))).limit(1);
  return item ?? null;
}

export async function createAdminContent(actor: AuditActor, input: ContentWriteInput) {
  return getDatabase().transaction(async (tx) => {
    const [item] = await tx.insert(contentItems).values({
      ownerId: actor.ownerId,
      ...input,
      publishedAt: input.status === "published" ? new Date() : null
    }).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "content.create",
      resourceType: "content_item", resourceId: item.id, changes: { after: item }, ipHash: actor.ipHash
    });
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
