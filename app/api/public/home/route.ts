import { NextResponse } from "next/server";
import { profile } from "@/lib/mock-data";
import { listLifeRecords, listStudyItems, listWorkProjects } from "@/lib/content-store";

export async function GET() {
  const [lifeRecords, studyItems, workProjects] = await Promise.all([listLifeRecords(), listStudyItems(), listWorkProjects()]);
  return NextResponse.json({
    profile,
    lifeRecords,
    studyItems,
    workProjects,
    suggestedQuestions: ["你是谁？", "介绍一下你的项目经历", "你适合什么研究方向？", "平时有什么兴趣？"]
  });
}
