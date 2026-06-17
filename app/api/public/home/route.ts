import { NextResponse } from "next/server";
import { lifeRecords, profile, studyItems, workProjects } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    profile,
    lifeRecords: lifeRecords.filter((item) => item.visibility === "public" && item.status === "published"),
    studyItems: studyItems.filter((item) => item.visibility === "public" && item.status === "published"),
    workProjects: workProjects.filter((item) => item.visibility === "public" && item.status === "published"),
    suggestedQuestions: ["你是谁？", "介绍一下你的项目经历", "你适合什么研究方向？", "平时有什么兴趣？"]
  });
}

