import { sql } from "drizzle-orm";
import type { Citation } from "../lib/types";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
  varchar
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
};

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const contentStatus = pgEnum("content_status", ["draft", "published", "archived"]);
export const visibility = pgEnum("visibility", ["public", "private", "unlisted"]);
export const messageRole = pgEnum("message_role", ["user", "assistant", "system"]);
export const questionStatus = pgEnum("question_status", ["new", "reviewed", "converted", "ignored"]);

export const owners = pgTable("owners", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 80 }).notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Shanghai"),
  ...timestamps
}, (table) => [uniqueIndex("owners_slug_uidx").on(table.slug)]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 32 }).notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps
}, (table) => [uniqueIndex("admin_users_owner_email_uidx").on(table.ownerId, table.email)]);

export const ownerProfiles = pgTable("owner_profiles", {
  ownerId: uuid("owner_id").primaryKey().references(() => owners.id, { onDelete: "cascade" }),
  nickname: varchar("nickname", { length: 120 }).notNull(),
  realName: varchar("real_name", { length: 120 }),
  headline: varchar("headline", { length: 300 }).notNull().default(""),
  bio: text("bio").notNull().default(""),
  city: varchar("city", { length: 120 }).notNull().default(""),
  contact: jsonb("contact").$type<{ email?: string; github?: string; wechat?: string }>().notNull().default(sql`'{}'::jsonb`),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  visibility: visibility("visibility").notNull().default("public"),
  isAiUsable: boolean("is_ai_usable").notNull().default(true),
  ...timestamps
});

export const contentItems = pgTable("content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 32 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  summary: text("summary"),
  body: text("body").notNull().default(""),
  status: contentStatus("status").notNull().default("draft"),
  visibility: visibility("visibility").notNull().default("private"),
  happenedAt: timestamp("happened_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  ...timestamps
}, (table) => [
  uniqueIndex("content_items_owner_slug_uidx").on(table.ownerId, table.slug),
  index("content_items_owner_type_status_idx").on(table.ownerId, table.type, table.status)
]);

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  altText: text("alt_text"),
  checksumSha256: varchar("checksum_sha256", { length: 64 }).notNull(),
  variant: varchar("variant", { length: 32 }).notNull().default("original"),
  parentAssetId: uuid("parent_asset_id"),
  ...timestamps
}, (table) => [
  uniqueIndex("media_assets_storage_key_uidx").on(table.storageKey),
  index("media_assets_owner_parent_idx").on(table.ownerId, table.parentAssetId)
]);

export const objectBlobs = pgTable("object_blobs", {
  key: text("key").primaryKey(),
  body: bytea("body").notNull(),
  contentType: varchar("content_type", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const contentMedia = pgTable("content_media", {
  contentId: uuid("content_id").notNull().references(() => contentItems.id, { onDelete: "cascade" }),
  mediaId: uuid("media_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0)
}, (table) => [primaryKey({ columns: [table.contentId, table.mediaId] })]);

export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  sourceType: varchar("source_type", { length: 40 }).notNull(),
  sourceId: text("source_id"),
  title: varchar("title", { length: 240 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  body: text("body").notNull(),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  status: contentStatus("status").notNull().default("draft"),
  visibility: visibility("visibility").notNull().default("private"),
  isAiUsable: boolean("is_ai_usable").notNull().default(false),
  ...timestamps
}, (table) => [index("knowledge_items_owner_status_idx").on(table.ownerId, table.status)]);

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  knowledgeItemId: uuid("knowledge_item_id").notNull().references(() => knowledgeItems.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count"),
  embeddingModel: varchar("embedding_model", { length: 100 }),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("knowledge_chunks_item_index_uidx").on(table.knowledgeItemId, table.chunkIndex),
  index("knowledge_chunks_embedding_hnsw_idx").using("hnsw", table.embedding.op("vector_cosine_ops"))
]);

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  visitorId: uuid("visitor_id").notNull().defaultRandom(),
  topic: varchar("topic", { length: 40 }).notNull().default("default"),
  entry: varchar("entry", { length: 80 }).notNull().default("chat"),
  relatedRecordId: text("related_record_id"),
  userAgent: text("user_agent"),
  ipHash: varchar("ip_hash", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("chat_sessions_owner_created_idx").on(table.ownerId, table.createdAt)]);

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: messageRole("role").notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations").$type<Citation[]>().notNull().default(sql`'[]'::jsonb`),
  provider: varchar("provider", { length: 50 }),
  model: varchar("model", { length: 100 }),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("chat_messages_session_created_idx").on(table.sessionId, table.createdAt)]);

export const visitorQuestions = pgTable("visitor_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => chatSessions.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => chatMessages.id, { onDelete: "set null" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  citations: jsonb("citations").$type<Citation[]>().notNull().default(sql`'[]'::jsonb`),
  topic: varchar("topic", { length: 40 }).notNull(),
  status: questionStatus("status").notNull().default("new"),
  convertedKnowledgeItemId: uuid("converted_knowledge_item_id"),
  ...timestamps
}, (table) => [index("visitor_questions_owner_status_idx").on(table.ownerId, table.status)]);

export const contactIntents = pgTable("contact_intents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  contact: varchar("contact", { length: 255 }).notNull(),
  purpose: varchar("purpose", { length: 80 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  ...timestamps
}, (table) => [index("contact_intents_owner_status_idx").on(table.ownerId, table.status)]);

export const aiCallLogs = pgTable("ai_call_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => chatSessions.id, { onDelete: "set null" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  latencyMs: integer("latency_ms"),
  success: boolean("success").notNull(),
  errorCode: varchar("error_code", { length: 80 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("ai_call_logs_owner_created_idx").on(table.ownerId, table.createdAt)]);

export const modelSettings = pgTable("model_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  baseUrl: text("base_url").notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  apiKeyEncrypted: text("api_key_encrypted"),
  apiKeyLastFour: varchar("api_key_last_four", { length: 4 }),
  temperatureMilli: integer("temperature_milli").notNull().default(700),
  maxTokens: integer("max_tokens").notNull().default(1200),
  isActive: boolean("is_active").notNull().default(false),
  ...timestamps
}, (table) => [index("model_settings_owner_active_idx").on(table.ownerId, table.isActive)]);

export const promptTemplates = pgTable("prompt_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  scene: varchar("scene", { length: 50 }).notNull().default("default"),
  systemPrompt: text("system_prompt").notNull(),
  safetyPrompt: text("safety_prompt").notNull().default(""),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(false),
  ...timestamps
}, (table) => [
  uniqueIndex("prompt_templates_owner_name_version_uidx").on(table.ownerId, table.name, table.version),
  index("prompt_templates_owner_scene_active_idx").on(table.ownerId, table.scene, table.isActive)
]);

export const apiRateLimitEvents = pgTable("api_rate_limit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyHash: varchar("key_hash", { length: 64 }).notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("api_rate_limit_events_lookup_idx").on(table.keyHash, table.action, table.createdAt)]);

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => owners.id, { onDelete: "cascade" }),
  adminUserId: uuid("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 80 }).notNull(),
  resourceId: uuid("resource_id"),
  changes: jsonb("changes").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  ipHash: varchar("ip_hash", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [index("admin_audit_logs_owner_created_idx").on(table.ownerId, table.createdAt)]);
