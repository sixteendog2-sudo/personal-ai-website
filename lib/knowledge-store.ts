import { and, desc, eq, sql } from "drizzle-orm";
import { getDatabase, isDatabaseConfigured } from "@/db/client";
import { knowledgeItems as knowledgeTable, visitorQuestions } from "@/db/schema";
import { knowledgeItems as mockKnowledge } from "@/lib/mock-data";
import * as memory from "@/lib/runtime-store";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";
import type { Citation, KnowledgeItem, SourceType, Topic, VisitorQuestion } from "@/lib/types";

function mapKnowledge(row: typeof knowledgeTable.$inferSelect): KnowledgeItem {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    category: row.category,
    body: row.body,
    tags: row.tags,
    sourceType: row.sourceType as SourceType,
    sourceId: row.sourceId ?? undefined,
    visibility: row.visibility,
    status: row.status,
    isAiUsable: row.isAiUsable
  };
}

function mapQuestion(row: typeof visitorQuestions.$inferSelect): VisitorQuestion {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    topic: row.topic as Topic,
    status: row.status === "reviewed" ? "valuable" : row.status,
    citations: row.citations as Citation[],
    convertedKnowledgeItemId: row.convertedKnowledgeItemId ?? undefined,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listKnowledgeItems() {
  if (!isDatabaseConfigured()) return [...memory.getRuntimeKnowledgeItems(), ...mockKnowledge];
  const rows = await getDatabase().select().from(knowledgeTable)
    .where(eq(knowledgeTable.ownerId, DEFAULT_OWNER_ID))
    .orderBy(desc(knowledgeTable.createdAt));
  return rows.map(mapKnowledge);
}

export async function searchKnowledgeCandidates(query: string, scope: "visitor" | "admin") {
  if (!isDatabaseConfigured()) return [...memory.getRuntimeKnowledgeItems(), ...mockKnowledge];
  const similarity = sql<number>`greatest(
    similarity(${knowledgeTable.title}, ${query}),
    similarity(${knowledgeTable.category}, ${query}),
    similarity(${knowledgeTable.body}, ${query}),
    similarity(array_to_string(${knowledgeTable.tags}, ' '), ${query})
  )`;
  const conditions = [
    eq(knowledgeTable.ownerId, DEFAULT_OWNER_ID),
    eq(knowledgeTable.status, "published"),
    eq(knowledgeTable.isAiUsable, true)
  ];
  if (scope === "visitor") conditions.push(eq(knowledgeTable.visibility, "public"));
  const rows = await getDatabase().select().from(knowledgeTable)
    .where(and(...conditions))
    .orderBy(desc(similarity), desc(knowledgeTable.updatedAt))
    .limit(50);
  return rows.map(mapKnowledge);
}

export async function listVisitorQuestions() {
  if (!isDatabaseConfigured()) return memory.getVisitorQuestions();
  const rows = await getDatabase().select().from(visitorQuestions)
    .where(eq(visitorQuestions.ownerId, DEFAULT_OWNER_ID))
    .orderBy(desc(visitorQuestions.createdAt));
  return rows.map(mapQuestion);
}

export async function convertQuestionToKnowledge(questionId: string) {
  if (!isDatabaseConfigured()) return memory.convertQuestionToKnowledge(questionId);

  return getDatabase().transaction(async (tx) => {
    const [question] = await tx.select().from(visitorQuestions)
      .where(eq(visitorQuestions.id, questionId))
      .limit(1);
    if (!question || question.ownerId !== DEFAULT_OWNER_ID) return null;

    if (question.convertedKnowledgeItemId) {
      const [existing] = await tx.select().from(knowledgeTable)
        .where(eq(knowledgeTable.id, question.convertedKnowledgeItemId))
        .limit(1);
      return existing ? mapKnowledge(existing) : null;
    }

    const [knowledge] = await tx.insert(knowledgeTable).values({
      ownerId: DEFAULT_OWNER_ID,
      title: question.question,
      category: "访客问题沉淀",
      body: `访客问题：${question.question}\n\n标准回答：${question.answer}`,
      tags: ["访客问题", question.topic],
      sourceType: "visitor_question",
      sourceId: question.id,
      visibility: "public",
      status: "published",
      isAiUsable: true
    }).returning();

    await tx.update(visitorQuestions).set({
      status: "converted",
      convertedKnowledgeItemId: knowledge.id,
      updatedAt: new Date()
    }).where(eq(visitorQuestions.id, question.id));

    return mapKnowledge(knowledge);
  });
}
