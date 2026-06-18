import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { convertQuestionToAdminKnowledge } from "@/lib/admin-knowledge-store";
import { getAdminRequestSession } from "@/lib/api-auth";
import { getRequestIpHash } from "@/lib/request-context";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const knowledge = await convertQuestionToAdminKnowledge({ ...session, ipHash: getRequestIpHash(request) }, id.data);
  return knowledge ? NextResponse.json({ item: knowledge }) : NextResponse.json({ error: "Question not found" }, { status: 404 });
}
