import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(50).default(10),
  DATABASE_SSL: z.enum(["true", "false"]).default("false"),
  STORAGE_DRIVER: z.enum(["database", "local", "s3"]).default("database"),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.enum(["true", "false"]).default("false"),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  DEEPSEEK_CHAT_MODEL: z.string().min(1).default("deepseek-chat"),
  SECRET_ENCRYPTION_KEY: z.string().min(32).optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  ADMIN_EMAIL: z.string().email().default("admin@personal.local"),
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
  if (!env.SECRET_ENCRYPTION_KEY && !env.ADMIN_SESSION_TOKEN) {
    throw new Error("SECRET_ENCRYPTION_KEY or ADMIN_SESSION_TOKEN is required to encrypt model API keys");
  }
  if (env.STORAGE_DRIVER === "s3" && (!env.S3_REGION || !env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY)) {
    throw new Error("S3 storage requires region, bucket and credentials");
  }
}
