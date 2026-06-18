import { getDatabase, isDatabaseConfigured } from "@/db/client";
import { aiCallLogs } from "@/db/schema";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";

export async function recordAiCall(input: {
  sessionId?: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
}) {
  if (!isDatabaseConfigured()) return;
  await getDatabase().insert(aiCallLogs).values({ ownerId: DEFAULT_OWNER_ID, ...input });
}
