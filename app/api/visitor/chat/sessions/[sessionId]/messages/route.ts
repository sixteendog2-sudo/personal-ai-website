import { NextResponse } from "next/server";
import { generateAiAnswer } from "@/lib/ai";
import { addChatMessage, addVisitorQuestion, ensureChatSession } from "@/lib/runtime-store";
import type { Topic } from "@/lib/types";

function normalizeTopic(topic: unknown): Topic {
  if (topic === "study" || topic === "life" || topic === "work" || topic === "admission" || topic === "career" || topic === "social") {
    return topic;
  }
  return "default";
}

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    message?: string;
    context?: {
      topic?: unknown;
      relatedRecordId?: string;
    };
  };

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > 1200) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  }

  const topic = normalizeTopic(body.context?.topic);
  const session = ensureChatSession({
    sessionId,
    topic,
    entry: "message-endpoint",
    relatedRecordId: body.context?.relatedRecordId
  });

  addChatMessage(session.id, {
    role: "user",
    content: message
  });

  const ai = await generateAiAnswer({
    message,
    topic,
    relatedRecordId: body.context?.relatedRecordId ?? session.relatedRecordId,
    history: session.messages
  });

  const assistant = addChatMessage(session.id, {
    role: "assistant",
    content: ai.answer,
    citations: ai.citations
  });

  const question = addVisitorQuestion({
    question: message,
    answer: ai.answer,
    topic,
    citations: ai.citations
  });

  return NextResponse.json({
    answer: ai.answer,
    citations: ai.citations,
    provider: ai.provider,
    model: ai.model,
    messageId: assistant?.id,
    questionId: question.id
  });
}
