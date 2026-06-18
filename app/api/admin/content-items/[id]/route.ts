import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { archiveAdminContent, getAdminContent, updateAdminContent } from "@/lib/admin-content-store";
import { getAdminRequestSession } from "@/lib/api-auth";
import { getRequestIpHash } from "@/lib/request-context";
import { contentPatchSchema } from "../schema";

const idSchema = z.uuid();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const item = await getAdminContent(session.ownerId, parsedId.data);
  return item ? NextResponse.json({ item }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsedId = idSchema.safeParse((await params).id);
  const parsed = contentPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsedId.success || !parsed.success) return NextResponse.json({ error: "Invalid update", fields: parsed.success ? undefined : z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  const item = await updateAdminContent({ ...session, ipHash: getRequestIpHash(request) }, parsedId.data, {
    ...parsed.data,
    happenedAt: parsed.data.happenedAt === undefined ? undefined : parsed.data.happenedAt ? new Date(parsed.data.happenedAt) : null
  });
  return item ? NextResponse.json({ item }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const item = await archiveAdminContent({ ...session, ipHash: getRequestIpHash(request) }, parsedId.data);
  return item ? NextResponse.json({ item }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
