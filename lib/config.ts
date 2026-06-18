import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(50).default(10),
  DATABASE_SSL: z.enum(["true", "false"]).default("false"),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  DEEPSEEK_CHAT_MODEL: z.string().min(1).default("deepseek-v4-flash"),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  ADMIN_SESSION_TOKEN: z.string().min(32).optional()
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid server configuration: ${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

export function assertProductionConfig() {
  if (env.NODE_ENV !== "production") return;

  const missing = [
    !env.DATABASE_URL && "DATABASE_URL",
    !env.ADMIN_PASSWORD && "ADMIN_PASSWORD",
    !env.ADMIN_SESSION_TOKEN && "ADMIN_SESSION_TOKEN"
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing production configuration: ${missing.join(", ")}`);
  }
}
