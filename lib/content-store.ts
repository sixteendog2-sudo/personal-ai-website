import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { contentItems } from "@/db/schema";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";
import type { LifeRecord, StudyItem, WorkProject } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 6;
const MAX_PAGE_SIZE = 20;

export type ContentPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

function normalizePageOptions(options?: { limit?: number; cursor?: string | null }) {
  const limit = Math.min(Math.max(options?.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const offset = options?.cursor && /^\d+$/.test(options.cursor) ? Number(options.cursor) : 0;
  return { limit, offset };
}

async function listRows(type: "life" | "study" | "work", options?: { limit?: number; cursor?: string | null }) {
  const { limit, offset } = normalizePageOptions(options);
  const rows = await getDatabase().select().from(contentItems).where(and(
    eq(contentItems.ownerId, DEFAULT_OWNER_ID),
    eq(contentItems.type, type),
    eq(contentItems.status, "published"),
    eq(contentItems.visibility, "public")
  )).orderBy(desc(contentItems.happenedAt), desc(contentItems.createdAt), desc(contentItems.id))
    .limit(limit + 1)
    .offset(offset);
  return {
    rows: rows.slice(0, limit),
    hasMore: rows.length > limit,
    nextCursor: rows.length > limit ? String(offset + limit) : null
  };
}

function mapLifeRecord(row: typeof contentItems.$inferSelect): LifeRecord {
  return {
    id: row.slug, ownerId: row.ownerId, title: row.title, excerpt: row.summary ?? "", body: row.body,
    occurredAt: row.happenedAt?.toISOString().slice(0, 10) ?? "", location: String(row.metadata.location ?? ""),
    mood: String(row.metadata.mood ?? ""), imageTone: String(row.metadata.imageTone ?? ""),
    tags: (row.metadata.tags as string[]) ?? [], isAiUsable: Boolean(row.metadata.isAiUsable),
    status: row.status, visibility: row.visibility
  };
}

function mapStudyItem(row: typeof contentItems.$inferSelect): StudyItem {
  return {
    id: row.slug, ownerId: row.ownerId, type: String(row.metadata.studyType ?? "other"), title: row.title,
    summary: row.summary ?? "", body: row.body, period: String(row.metadata.period ?? ""),
    institution: String(row.metadata.institution ?? ""), tags: (row.metadata.tags as string[]) ?? [],
    isAiUsable: Boolean(row.metadata.isAiUsable), status: row.status, visibility: row.visibility
  };
}

function mapWorkProject(row: typeof contentItems.$inferSelect): WorkProject {
  return {
    id: row.slug, ownerId: row.ownerId, title: row.title, summary: row.summary ?? "", body: row.body,
    role: String(row.metadata.role ?? ""), techStack: (row.metadata.techStack as string[]) ?? [],
    result: String(row.metadata.result ?? ""), period: String(row.metadata.period ?? ""),
    imageTone: String(row.metadata.imageTone ?? ""), tags: (row.metadata.tags as string[]) ?? [],
    isAiUsable: Boolean(row.metadata.isAiUsable), status: row.status, visibility: row.visibility
  };
}

async function getRow(type: "life" | "study" | "work", slug: string) {
  const [row] = await getDatabase().select().from(contentItems).where(and(
    eq(contentItems.ownerId, DEFAULT_OWNER_ID),
    eq(contentItems.type, type),
    eq(contentItems.slug, slug),
    eq(contentItems.status, "published"),
    eq(contentItems.visibility, "public")
  )).limit(1);
  return row ?? null;
}

export async function listLifeRecordsPage(options?: { limit?: number; cursor?: string | null }): Promise<ContentPage<LifeRecord>> {
  const page = await listRows("life", options);
  return { items: page.rows.map(mapLifeRecord), hasMore: page.hasMore, nextCursor: page.nextCursor };
}

export async function listLifeRecords(): Promise<LifeRecord[]> {
  return (await listLifeRecordsPage({ limit: MAX_PAGE_SIZE })).items;
}

export async function getLifeRecord(slug: string) {
  const row = await getRow("life", slug);
  return row ? mapLifeRecord(row) : undefined;
}

export async function listStudyItemsPage(options?: { limit?: number; cursor?: string | null }): Promise<ContentPage<StudyItem>> {
  const page = await listRows("study", options);
  return { items: page.rows.map(mapStudyItem), hasMore: page.hasMore, nextCursor: page.nextCursor };
}

export async function listStudyItems(): Promise<StudyItem[]> {
  return (await listStudyItemsPage({ limit: MAX_PAGE_SIZE })).items;
}

export async function getStudyItem(slug: string) {
  const row = await getRow("study", slug);
  return row ? mapStudyItem(row) : undefined;
}

export async function listWorkProjectsPage(options?: { limit?: number; cursor?: string | null }): Promise<ContentPage<WorkProject>> {
  const page = await listRows("work", options);
  return { items: page.rows.map(mapWorkProject), hasMore: page.hasMore, nextCursor: page.nextCursor };
}

export async function listWorkProjects(): Promise<WorkProject[]> {
  return (await listWorkProjectsPage({ limit: MAX_PAGE_SIZE })).items;
}

export async function getWorkProject(slug: string) {
  const row = await getRow("work", slug);
  return row ? mapWorkProject(row) : undefined;
}
