import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminContent, listAdminContent } from "@/lib/admin-content-store";
import { getAdminRequestSession } from "@/lib/api-auth";
import { getRequestIpHash } from "@/lib/request-context";
import { contentWriteSchema } from "./schema";

export async function GET(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: await listAdminContent(session.ownerId, {
    type: request.nextUrl.searchParams.get("type") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined
  }) });
}

export async function POST(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = contentWriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid content", fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });

  try {
    const item = await createAdminContent({ ...session, ipHash: getRequestIpHash(request) }, {
      ...parsed.data,
      happenedAt: parsed.data.happenedAt ? new Date(parsed.data.happenedAt) : null
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "Content identifier conflict, please retry" }, { status: 409 });
    }
    throw error;
  }
}
