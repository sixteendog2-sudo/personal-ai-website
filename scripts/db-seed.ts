import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

const DEFAULT_OWNER_ID = "00000000-0000-4000-8000-000000000001";

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getDatabase }, { adminUsers, knowledgeItems: knowledgeTable, owners }, mock] = await Promise.all([
    import("../db/client"),
    import("../db/schema"),
    import("../lib/mock-data")
  ]);
  const db = getDatabase();

  await db.insert(owners).values({
    id: DEFAULT_OWNER_ID,
    slug: "sixteen",
    displayName: mock.profile.nickname
  }).onConflictDoUpdate({
    target: owners.slug,
    set: { displayName: mock.profile.nickname, updatedAt: new Date() }
  });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("ADMIN_PASSWORD is required to seed the admin user");
  const passwordHash = await hash(adminPassword, 12);
  await db.insert(adminUsers).values({
    ownerId: DEFAULT_OWNER_ID,
    email: process.env.ADMIN_EMAIL ?? "admin@personal.local",
    passwordHash,
    role: "owner"
  }).onConflictDoUpdate({
    target: [adminUsers.ownerId, adminUsers.email],
    set: { passwordHash, isActive: true, updatedAt: new Date() }
  });

  const existing = await db.select({ id: knowledgeTable.id })
    .from(knowledgeTable)
    .where(eq(knowledgeTable.ownerId, DEFAULT_OWNER_ID))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(knowledgeTable).values(mock.knowledgeItems.map((item) => ({
      ownerId: DEFAULT_OWNER_ID,
      sourceType: item.sourceType,
      title: item.title,
      category: item.category,
      body: item.body,
      tags: item.tags,
      status: item.status,
      visibility: item.visibility,
      isAiUsable: item.isAiUsable
    })));
  }

  console.log(`Seed complete for owner ${DEFAULT_OWNER_ID}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
