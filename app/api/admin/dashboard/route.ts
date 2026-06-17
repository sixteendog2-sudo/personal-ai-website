import { NextResponse } from "next/server";
import { knowledgeItems, lifeRecords, studyItems, workProjects } from "@/lib/mock-data";
import { getChatSessions, getVisitorQuestions } from "@/lib/runtime-store";

export async function GET() {
  const questions = getVisitorQuestions();
  const sessions = getChatSessions();

  return NextResponse.json({
    metrics: {
      knowledgeItems: knowledgeItems.length,
      aiUsableKnowledge: knowledgeItems.filter((item) => item.isAiUsable).length,
      lifeRecords: lifeRecords.length,
      studyItems: studyItems.length,
      workProjects: workProjects.length,
      chatSessions: sessions.length,
      visitorQuestions: questions.length,
      pendingQuestions: questions.filter((item) => item.status === "new").length
    }
  });
}

