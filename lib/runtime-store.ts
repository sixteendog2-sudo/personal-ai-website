import { randomUUID } from "crypto";
import type { ChatMessage, ChatSession, Topic, VisitorQuestion } from "./types";

const sessions = new Map<string, ChatSession>();
const visitorQuestions: VisitorQuestion[] = [];

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

export function getChatSessions() {
  return Array.from(sessions.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

