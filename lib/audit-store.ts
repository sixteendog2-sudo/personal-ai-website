import { desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { adminAuditLogs } from "@/db/schema";

export async function listAuditLogs(ownerId: string, limit = 100) {
  return getDatabase().select().from(adminAuditLogs)
    .where(eq(adminAuditLogs.ownerId, ownerId))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}
