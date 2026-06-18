import { desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { contactIntents } from "@/db/schema";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";

export async function createContactIntent(input: { name: string; contact: string; purpose: string; message: string }) {
  const [created] = await getDatabase().insert(contactIntents).values({ ownerId: DEFAULT_OWNER_ID, ...input }).returning();
  return created;
}

export async function listContactIntents() {
  return getDatabase().select().from(contactIntents)
    .where(eq(contactIntents.ownerId, DEFAULT_OWNER_ID))
    .orderBy(desc(contactIntents.createdAt));
}
