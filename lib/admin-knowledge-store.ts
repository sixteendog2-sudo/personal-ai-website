import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { adminAuditLogs, knowledgeChunks, knowledgeItems, visitorQuestions } from "@/db/schema";
import { chunkKnowledgeText, estimateTokenCount } from "@/lib/knowledge-chunks";

export type KnowledgeWriteInput = {
  title: string;
  category: string;
  body: string;
  tags: string[];
  sourceType: string;
  sourceId?: string | null;
  visibility: "public" | "private" | "unlisted";
  status: "draft" | "published" | "archived";
  isAiUsable: boolean;
};

type Actor = { ownerId: string; adminUserId: string; ipHash: string };

async function replaceChunks(tx: Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0], itemId: string, body: string) {
  await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.knowledgeItemId, itemId));
  const chunks = chunkKnowledgeText(body);
  if (chunks.length) {
    await tx.insert(knowledgeChunks).values(chunks.map((content, chunkIndex) => ({
      knowledgeItemId: itemId, chunkIndex, content, tokenCount: estimateTokenCount(content)
    })));
  }
}

export async function listAdminKnowledge(ownerId: string) {
  return getDatabase().select().from(knowledgeItems).where(eq(knowledgeItems.ownerId, ownerId)).orderBy(desc(knowledgeItems.updatedAt));
}

export async function getAdminKnowledge(ownerId: string, id: string) {
  const [item] = await getDatabase().select().from(knowledgeItems)
    .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.ownerId, ownerId))).limit(1);
  return item ?? null;
}

export async function createAdminKnowledge(actor: Actor, input: KnowledgeWriteInput) {
  return getDatabase().transaction(async (tx) => {
    const [item] = await tx.insert(knowledgeItems).values({ ownerId: actor.ownerId, ...input }).returning();
    await replaceChunks(tx, item.id, item.body);
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "knowledge.create",
      resourceType: "knowledge_item", resourceId: item.id,
      changes: { title: item.title, status: item.status, visibility: item.visibility }, ipHash: actor.ipHash
    });
    return item;
  });
}

export async function updateAdminKnowledge(actor: Actor, id: string, input: Partial<KnowledgeWriteInput>) {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(knowledgeItems)
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.ownerId, actor.ownerId))).limit(1);
    if (!before) return null;
    const [item] = await tx.update(knowledgeItems).set({ ...input, updatedAt: new Date() })
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.ownerId, actor.ownerId))).returning();
    if (input.body !== undefined && input.body !== before.body) await replaceChunks(tx, id, item.body);
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "knowledge.update",
      resourceType: "knowledge_item", resourceId: id, changes: { before, after: item }, ipHash: actor.ipHash
    });
    return item;
  });
}

export async function archiveAdminKnowledge(actor: Actor, id: string) {
  return getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(knowledgeItems)
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.ownerId, actor.ownerId))).limit(1);
    if (!before) return null;
    const [item] = await tx.update(knowledgeItems).set({ status: "archived", isAiUsable: false, updatedAt: new Date() })
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.ownerId, actor.ownerId))).returning();
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "knowledge.archive",
      resourceType: "knowledge_item", resourceId: id, changes: { before, after: item }, ipHash: actor.ipHash
    });
    return item;
  });
}

export async function convertQuestionToAdminKnowledge(actor: Actor, questionId: string) {
  return getDatabase().transaction(async (tx) => {
    const [question] = await tx.select().from(visitorQuestions).where(and(
      eq(visitorQuestions.id, questionId), eq(visitorQuestions.ownerId, actor.ownerId)
    )).limit(1);
    if (!question) return null;
    if (question.convertedKnowledgeItemId) {
      const [existing] = await tx.select().from(knowledgeItems).where(and(
        eq(knowledgeItems.id, question.convertedKnowledgeItemId), eq(knowledgeItems.ownerId, actor.ownerId)
      )).limit(1);
      return existing ?? null;
    }

    const body = `访客问题：${question.question}\n\n标准回答：${question.answer}`;
    const [item] = await tx.insert(knowledgeItems).values({
      ownerId: actor.ownerId, title: question.question, category: "访客问题沉淀", body,
      tags: ["访客问题", question.topic], sourceType: "visitor_question", sourceId: question.id,
      visibility: "public", status: "published", isAiUsable: true
    }).returning();
    await replaceChunks(tx, item.id, body);
    await tx.update(visitorQuestions).set({
      status: "converted", convertedKnowledgeItemId: item.id, updatedAt: new Date()
    }).where(eq(visitorQuestions.id, question.id));
    await tx.insert(adminAuditLogs).values({
      ownerId: actor.ownerId, adminUserId: actor.adminUserId, action: "question.convert_to_knowledge",
      resourceType: "knowledge_item", resourceId: item.id,
      changes: { questionId: question.id, title: item.title }, ipHash: actor.ipHash
    });
    return item;
  });
}
