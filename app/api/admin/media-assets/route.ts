import { NextRequest, NextResponse } from "next/server";
import { getAdminRequestSession } from "@/lib/api-auth";
import { listMediaAssets, MediaValidationError, uploadImage } from "@/lib/media-store";
import { getRequestIpHash } from "@/lib/request-context";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: await listMediaAssets(session.ownerId) });
}

export async function POST(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  const altText = form?.get("altText");
  try {
    const item = await uploadImage({ ...session, ipHash: getRequestIpHash(request) }, file, typeof altText === "string" ? altText : undefined);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof MediaValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
