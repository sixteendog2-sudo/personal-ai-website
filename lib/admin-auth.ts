import { compare } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";

export async function authenticateAdmin(password: string) {
  const [admin] = await getDatabase().select().from(adminUsers).where(and(
    eq(adminUsers.ownerId, DEFAULT_OWNER_ID),
    eq(adminUsers.isActive, true)
  )).limit(1);

  if (!admin || !(await compare(password, admin.passwordHash))) return null;
  await getDatabase().update(adminUsers).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(adminUsers.id, admin.id));
  return admin;
}
