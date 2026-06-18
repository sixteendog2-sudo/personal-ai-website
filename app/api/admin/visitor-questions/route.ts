import { NextResponse } from "next/server";
import { listVisitorQuestions } from "@/lib/knowledge-store";

const fallbackQuestions = [
  {
    id: "demo-q-1",
    question: "介绍一下你的项目经历",
    answer: "可以，从公开记录看，他正在构建个人 AI 数字分身网站。",
    topic: "career",
    status: "new",
    citations: [],
    createdAt: "demo"
  },
  {
    id: "demo-q-2",
    question: "你适合什么研究方向？",
    answer: "目前比较关注 AI 应用、个人知识管理和 RAG。",
    topic: "admission",
    status: "valuable",
    citations: [],
    createdAt: "demo"
  }
];

export async function GET() {
  const questions = await listVisitorQuestions();
  return NextResponse.json({
    items: questions.length ? questions : fallbackQuestions
  });
}
