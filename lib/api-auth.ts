import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { adminUsers } from "@/db/schema";

export async function getAdminRequestSession(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return null;
  const session = await verifyAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) return null;
  const [admin] = await getDatabase().select({ id: adminUsers.id }).from(adminUsers).where(and(
    eq(adminUsers.id, session.adminUserId),
    eq(adminUsers.ownerId, session.ownerId),
    eq(adminUsers.isActive, true)
  )).limit(1);
  return admin ? session : null;
}
