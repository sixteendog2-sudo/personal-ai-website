import { and, count, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { chatSessions, contentItems, knowledgeItems, visitorQuestions } from "@/db/schema";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";

async function countContent(type: string) {
  const [result] = await getDatabase().select({ value: count() }).from(contentItems)
    .where(and(eq(contentItems.ownerId, DEFAULT_OWNER_ID), eq(contentItems.type, type)));
  return result.value;
}

export async function getDashboardMetrics() {
  const db = getDatabase();
  const [knowledge, usable, life, study, work, sessions, questions, pending] = await Promise.all([
    db.select({ value: count() }).from(knowledgeItems).where(eq(knowledgeItems.ownerId, DEFAULT_OWNER_ID)),
    db.select({ value: count() }).from(knowledgeItems).where(and(eq(knowledgeItems.ownerId, DEFAULT_OWNER_ID), eq(knowledgeItems.isAiUsable, true))),
    countContent("life"), countContent("study"), countContent("work"),
    db.select({ value: count() }).from(chatSessions).where(eq(chatSessions.ownerId, DEFAULT_OWNER_ID)),
    db.select({ value: count() }).from(visitorQuestions).where(eq(visitorQuestions.ownerId, DEFAULT_OWNER_ID)),
    db.select({ value: count() }).from(visitorQuestions).where(and(eq(visitorQuestions.ownerId, DEFAULT_OWNER_ID), eq(visitorQuestions.status, "new")))
  ]);
  return {
    knowledgeItems: knowledge[0].value, aiUsableKnowledge: usable[0].value,
    lifeRecords: life, studyItems: study, workProjects: work,
    chatSessions: sessions[0].value, visitorQuestions: questions[0].value, pendingQuestions: pending[0].value
  };
}
