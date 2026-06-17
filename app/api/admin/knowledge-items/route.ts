import { NextResponse } from "next/server";
import { knowledgeItems } from "@/lib/mock-data";
import { getRuntimeKnowledgeItems } from "@/lib/runtime-store";

export async function GET() {
  return NextResponse.json({
    items: [...getRuntimeKnowledgeItems(), ...knowledgeItems]
  });
}

