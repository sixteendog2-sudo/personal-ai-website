import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth";
import { getDeliverableMedia } from "@/lib/media-store";
import { getObjectStorage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const session = await verifyAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  const asset = await getDeliverableMedia(parsed.data, session?.ownerId);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await getObjectStorage().get(asset.storageKey);
    return new NextResponse(Buffer.from(body), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.originalName)}`,
        ETag: `"${asset.checksumSha256}"`,
        "Cache-Control": session ? "private, no-store" : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ error: "Stored object unavailable" }, { status: 404 });
  }
}
