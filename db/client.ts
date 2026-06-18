import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/config";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: ReturnType<typeof postgres>;
  database?: Database;
};

export function isDatabaseConfigured() {
  return Boolean(env.DATABASE_URL);
}

export function getDatabase() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for persistent storage");
  }

  if (!globalForDb.postgresClient) {
    globalForDb.postgresClient = postgres(env.DATABASE_URL, {
      max: env.DATABASE_MAX_CONNECTIONS,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: env.DATABASE_SSL === "true" ? "require" : false,
      prepare: false
    });
  }

  globalForDb.database ??= drizzle(globalForDb.postgresClient, { schema });
  return globalForDb.database;
}

export async function checkDatabase() {
  if (!env.DATABASE_URL) return { configured: false, reachable: false };
  const startedAt = performance.now();
  await getDatabase().execute(sql`select 1`);
  return {
    configured: true,
    reachable: true,
    latencyMs: Math.round(performance.now() - startedAt)
  };
}
