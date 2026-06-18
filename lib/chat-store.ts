import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDatabase, isDatabaseConfigured } from "@/db/client";
import { chatMessages, chatSessions, visitorQuestions } from "@/db/schema";
import * as memory from "@/lib/runtime-store";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";
import type { ChatMessage, Citation, Topic, VisitorQuestion } from "@/lib/types";

type SessionInput = {
  topic?: Topic;
  entry?: string;
  relatedRecordId?: string;
};

function mapMessage(row: typeof chatMessages.$inferSelect): ChatMessage {
  return {
    id: row.id,
    role: row.role === "user" ? "user" : "assistant",
    content: row.content,
    citations: row.citations as Citation[],
    createdAt: row.createdAt.toISOString()
  };
}

export async function createChatSession(input: SessionInput) {
  if (!isDatabaseConfigured()) return memory.createChatSession(input);

  const [session] = await getDatabase().insert(chatSessions).values({
    ownerId: DEFAULT_OWNER_ID,
    topic: input.topic ?? "default",
    entry: input.entry ?? "chat",
    relatedRecordId: input.relatedRecordId
  }).returning();

  return { ...session, messages: [], createdAt: session.createdAt.toISOString() };
}

export async function ensureChatSession(sessionId: string, input: SessionInput) {
  if (!isDatabaseConfigured()) return memory.ensureChatSession({ sessionId, ...input });

  const db = getDatabase();
  let [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
  if (!session) {
    [session] = await db.insert(chatSessions).values({
      id: sessionId,
      ownerId: DEFAULT_OWNER_ID,
      topic: input.topic ?? "default",
      entry: input.entry ?? "chat",
      relatedRecordId: input.relatedRecordId
    }).returning();
  }

  const rows = await db.select().from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));

  return {
    ...session,
    topic: session.topic as Topic,
    relatedRecordId: session.relatedRecordId ?? undefined,
    messages: rows.filter((row) => row.role !== "system").map(mapMessage),
    createdAt: session.createdAt.toISOString()
  };
}

export async function addChatMessage(
  sessionId: string,
  message: Omit<ChatMessage, "id" | "createdAt"> & { provider?: string; model?: string; latencyMs?: number }
) {
  if (!isDatabaseConfigured()) return memory.addChatMessage(sessionId, message);

  const db = getDatabase();
  const [created] = await db.insert(chatMessages).values({
    sessionId,
    role: message.role,
    content: message.content,
    citations: message.citations ?? [],
    provider: message.provider,
    model: message.model,
    latencyMs: message.latencyMs
  }).returning();
  await db.update(chatSessions).set({ lastMessageAt: new Date() }).where(eq(chatSessions.id, sessionId));
  return mapMessage(created);
}

export async function addVisitorQuestion(input: {
  sessionId?: string;
  messageId?: string;
  question: string;
  answer: string;
  topic: Topic;
  citations: Citation[];
}) {
  if (!isDatabaseConfigured()) return memory.addVisitorQuestion(input);

  const [created] = await getDatabase().insert(visitorQuestions).values({
    ownerId: DEFAULT_OWNER_ID,
    sessionId: input.sessionId,
    messageId: input.messageId,
    question: input.question,
    answer: input.answer,
    topic: input.topic,
    citations: input.citations
  }).returning();

  return {
    ...created,
    topic: created.topic as Topic,
    citations: created.citations as Citation[],
    status: created.status as VisitorQuestion["status"],
    convertedKnowledgeItemId: created.convertedKnowledgeItemId ?? undefined,
    createdAt: created.createdAt.toISOString()
  };
}

export async function listChatSessions() {
  if (!isDatabaseConfigured()) return memory.getChatSessions();
  const db = getDatabase();
  const sessions = await db.select().from(chatSessions).where(eq(chatSessions.ownerId, DEFAULT_OWNER_ID)).orderBy(desc(chatSessions.createdAt));
  if (sessions.length === 0) return [];
  const messages = await db.select().from(chatMessages)
    .where(inArray(chatMessages.sessionId, sessions.map((session) => session.id)))
    .orderBy(asc(chatMessages.createdAt));
  return sessions.map((session) => ({
    id: session.id, visitorId: session.visitorId, topic: session.topic as Topic, entry: session.entry,
    relatedRecordId: session.relatedRecordId ?? undefined,
    messages: messages.filter((message) => message.sessionId === session.id && message.role !== "system").map(mapMessage),
    createdAt: session.createdAt.toISOString()
  }));
}
