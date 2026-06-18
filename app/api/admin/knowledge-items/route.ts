import { NextResponse } from "next/server";
import { listKnowledgeItems } from "@/lib/knowledge-store";

export async function GET() {
  return NextResponse.json({
    items: await listKnowledgeItems()
  });
}
