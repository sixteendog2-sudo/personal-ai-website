import { and, count, eq, gte, lt, min, sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { apiRateLimitEvents } from "@/db/schema";

export async function consumeRateLimit(input: { keyHash: string; action: string; limit: number; windowSeconds: number }) {
  const db = getDatabase();
  const now = new Date();
  const windowStart = new Date(now.getTime() - input.windowSeconds * 1000);

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${input.keyHash}:${input.action}`}))`);
    const [usage] = await tx.select({ value: count(), earliest: min(apiRateLimitEvents.createdAt) })
      .from(apiRateLimitEvents)
      .where(and(
        eq(apiRateLimitEvents.keyHash, input.keyHash),
        eq(apiRateLimitEvents.action, input.action),
        gte(apiRateLimitEvents.createdAt, windowStart)
      ));

    if (usage.value >= input.limit) {
      const earliest = usage.earliest ? new Date(usage.earliest) : now;
      return {
        allowed: false as const,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((earliest.getTime() + input.windowSeconds * 1000 - now.getTime()) / 1000))
      };
    }

    await tx.insert(apiRateLimitEvents).values({ keyHash: input.keyHash, action: input.action });
    await tx.delete(apiRateLimitEvents).where(lt(apiRateLimitEvents.createdAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));
    return { allowed: true as const, remaining: input.limit - usage.value - 1, retryAfterSeconds: 0 };
  });
}
