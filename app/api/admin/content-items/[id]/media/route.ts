import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminRequestSession } from "@/lib/api-auth";
import { attachMediaToContent } from "@/lib/media-store";
import { getRequestIpHash } from "@/lib/request-context";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({ mediaId: z.uuid(), sortOrder: z.number().int().min(0).max(1000).default(0) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsedParams = paramsSchema.safeParse(await params);
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedParams.success || !parsedBody.success) return NextResponse.json({ error: "Invalid media link" }, { status: 400 });
  const link = await attachMediaToContent(
    { ...session, ipHash: getRequestIpHash(request) },
    parsedParams.data.id, parsedBody.data.mediaId, parsedBody.data.sortOrder
  );
  return link ? NextResponse.json({ item: link }, { status: 201 }) : NextResponse.json({ error: "Content or media not found" }, { status: 404 });
}
