import { NextResponse } from "next/server";
import { convertQuestionToKnowledge } from "@/lib/knowledge-store";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const knowledge = await convertQuestionToKnowledge(id);

  if (!knowledge) {
    return NextResponse.json({ error: "Question not found or demo fallback cannot be converted" }, { status: 404 });
  }

  return NextResponse.json({ item: knowledge });
}
