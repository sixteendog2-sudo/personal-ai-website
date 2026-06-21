import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminRequestSession } from "@/lib/api-auth";
import { attachMediaToContent, deleteOrphanedMedia, detachMediaFromContent } from "@/lib/media-store";
import { getRequestIpHash } from "@/lib/request-context";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({ mediaId: z.uuid(), sortOrder: z.number().int().min(0).max(1000).default(0), replace: z.boolean().default(false) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsedParams = paramsSchema.safeParse(await params);
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedParams.success || !parsedBody.success) return NextResponse.json({ error: "Invalid media link" }, { status: 400 });
  const link = await attachMediaToContent(
    { ...session, ipHash: getRequestIpHash(request) },
    parsedParams.data.id, parsedBody.data.mediaId, parsedBody.data.sortOrder, parsedBody.data.replace
  );
  if (!link) return NextResponse.json({ error: "Content or media not found" }, { status: 404 });
  await deleteOrphanedMedia(session.ownerId, link.replacedMediaIds);
  return NextResponse.json({ item: link }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ error: "Invalid content id" }, { status: 400 });
  const payload = await request.json().catch(() => ({})) as { mediaId?: unknown };
  const mediaId = typeof payload.mediaId === "string" && z.uuid().safeParse(payload.mediaId).success ? payload.mediaId : undefined;
  const removed = await detachMediaFromContent(
    { ...session, ipHash: getRequestIpHash(request) }, parsedParams.data.id, mediaId
  );
  if (!removed) return NextResponse.json({ error: "Content not found" }, { status: 404 });
  await deleteOrphanedMedia(session.ownerId, removed);
  return NextResponse.json({ removed });
}
