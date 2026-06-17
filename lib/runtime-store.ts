import { randomUUID } from "crypto";
import { OWNER_ID } from "./mock-data";
import type { ChatMessage, ChatSession, KnowledgeItem, Topic, VisitorQuestion } from "./types";

const sessions = new Map<string, ChatSession>();
const visitorQuestions: VisitorQuestion[] = [];
const runtimeKnowledgeItems: KnowledgeItem[] = [];

export function createChatSession({
  topic = "default",
  entry = "home",
  relatedRecordId
}: {
  topic?: Topic;
  entry?: string;
  relatedRecordId?: string;
}) {
  const session: ChatSession = {
    id: randomUUID(),
    visitorId: randomUUID(),
    topic,
    entry,
    relatedRecordId,
    messages: [],
    createdAt: new Date().toISOString()
  };
  sessions.set(session.id, session);
  return session;
}

export function ensureChatSession({
  sessionId,
  topic = "default",
  entry = "chat",
  relatedRecordId
}: {
  sessionId: string;
  topic?: Topic;
  entry?: string;
  relatedRecordId?: string;
}) {
  const existing = sessions.get(sessionId);
  if (existing) {
    return existing;
  }

  const session: ChatSession = {
    id: sessionId,
    visitorId: randomUUID(),
    topic,
    entry,
    relatedRecordId,
    messages: [],
    createdAt: new Date().toISOString()
  };
  sessions.set(session.id, session);
  return session;
}

export function getChatSession(sessionId: string) {
  return sessions.get(sessionId);
}

export function addChatMessage(sessionId: string, message: Omit<ChatMessage, "id" | "createdAt">) {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  const next: ChatMessage = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...message
  };
  session.messages.push(next);
  return next;
}

export function addVisitorQuestion(question: Omit<VisitorQuestion, "id" | "createdAt" | "status">) {
  const next: VisitorQuestion = {
    id: randomUUID(),
    status: "new",
    createdAt: new Date().toISOString(),
    ...question
  };
  visitorQuestions.unshift(next);
  return next;
}

export function getVisitorQuestions() {
  return visitorQuestions;
}

export function getVisitorQuestion(questionId: string) {
  return visitorQuestions.find((question) => question.id === questionId);
}

export function convertQuestionToKnowledge(questionId: string) {
  const question = getVisitorQuestion(questionId);
  if (!question) {
    return null;
  }

  const knowledge: KnowledgeItem = {
    id: randomUUID(),
    ownerId: OWNER_ID,
    title: question.question,
    category: "访客问题沉淀",
    body: `访客问题：${question.question}\n\n标准回答：${question.answer}`,
    tags: ["访客问题", question.topic],
    sourceType: "visitor_question",
    sourceId: question.id,
    visibility: "public",
    status: "published",
    isAiUsable: true
  };

  runtimeKnowledgeItems.unshift(knowledge);
  question.status = "converted";
  question.convertedKnowledgeItemId = knowledge.id;
  return knowledge;
}

export function getRuntimeKnowledgeItems() {
  return runtimeKnowledgeItems;
}

export function getChatSessions() {
  return Array.from(sessions.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
