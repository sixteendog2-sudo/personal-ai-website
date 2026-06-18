import { NextRequest, NextResponse } from "next/server";
import { createChatSession } from "@/lib/chat-store";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getVisitorRateLimitKey } from "@/lib/request-context";
import type { Topic } from "@/lib/types";

function normalizeTopic(topic: unknown): Topic {
  if (topic === "study" || topic === "life" || topic === "work" || topic === "admission" || topic === "career" || topic === "social") {
    return topic;
  }
  return "default";
}

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit({ keyHash: getVisitorRateLimitKey(request), action: "chat.session.create", limit: 20, windowSeconds: 3600 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many chat sessions" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const body = (await request.json().catch(() => ({}))) as {
    topic?: unknown;
    entry?: string;
    relatedRecordId?: string;
  };

  const session = await createChatSession({
    topic: normalizeTopic(body.topic),
    entry: body.entry ?? "chat",
    relatedRecordId: body.relatedRecordId
  });

  return NextResponse.json({
    sessionId: session.id,
    suggestedQuestions: ["你是谁？", "介绍一下你的项目经历", "你适合什么研究方向？", "平时有什么兴趣？"]
  });
}
