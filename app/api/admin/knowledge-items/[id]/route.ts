import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { archiveAdminKnowledge, getAdminKnowledge, updateAdminKnowledge } from "@/lib/admin-knowledge-store";
import { getAdminRequestSession } from "@/lib/api-auth";
import { getRequestIpHash } from "@/lib/request-context";
import { knowledgePatchSchema } from "../schema";

const idSchema = z.uuid();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const item = await getAdminKnowledge(session.ownerId, id.data);
  return item ? NextResponse.json({ item }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  const input = knowledgePatchSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !input.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const item = await updateAdminKnowledge({ ...session, ipHash: getRequestIpHash(request) }, id.data, input.data);
  return item ? NextResponse.json({ item }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const item = await archiveAdminKnowledge({ ...session, ipHash: getRequestIpHash(request) }, id.data);
  return item ? NextResponse.json({ item }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
