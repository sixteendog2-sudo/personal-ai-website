import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminKnowledge, listAdminKnowledge } from "@/lib/admin-knowledge-store";
import { getAdminRequestSession } from "@/lib/api-auth";
import { getRequestIpHash } from "@/lib/request-context";
import { knowledgeWriteSchema } from "./schema";

export async function GET(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: await listAdminKnowledge(session.ownerId) });
}

export async function POST(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = knowledgeWriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid knowledge item", fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  const item = await createAdminKnowledge({ ...session, ipHash: getRequestIpHash(request) }, parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
