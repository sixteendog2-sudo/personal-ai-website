import { NextRequest, NextResponse } from "next/server";
import { getAdminRequestSession } from "@/lib/api-auth";
import { listAuditLogs } from "@/lib/audit-store";

export async function GET(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 100);
  return NextResponse.json({ items: await listAuditLogs(session.ownerId, Number.isFinite(requestedLimit) ? requestedLimit : 100) });
}
