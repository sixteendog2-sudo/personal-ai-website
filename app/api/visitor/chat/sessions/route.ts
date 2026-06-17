import { NextResponse } from "next/server";
import { createChatSession } from "@/lib/runtime-store";
import type { Topic } from "@/lib/types";

function normalizeTopic(topic: unknown): Topic {
  if (topic === "study" || topic === "life" || topic === "work" || topic === "admission" || topic === "career" || topic === "social") {
    return topic;
  }
  return "default";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    topic?: unknown;
    entry?: string;
    relatedRecordId?: string;
  };

  const session = createChatSession({
    topic: normalizeTopic(body.topic),
    entry: body.entry ?? "chat",
    relatedRecordId: body.relatedRecordId
  });

  return NextResponse.json({
    sessionId: session.id,
    suggestedQuestions: ["你是谁？", "介绍一下你的项目经历", "你适合什么研究方向？", "平时有什么兴趣？"]
  });
}

