import { and, desc, eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { contentItems, contentMedia, mediaAssets } from "@/db/schema";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";
import type { ContentImage, LifeRecord, StudyItem, WorkProject } from "@/lib/types";

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
  )).orderBy(desc(contentItems.updatedAt), desc(contentItems.happenedAt), desc(contentItems.createdAt), desc(contentItems.id))
    .limit(limit + 1)
    .offset(offset);
  return {
    rows: rows.slice(0, limit),
    hasMore: rows.length > limit,
    nextCursor: rows.length > limit ? String(offset + limit) : null
  };
}

async function contentImages(rows: Array<typeof contentItems.$inferSelect>) {
  const result = new Map<string, ContentImage[]>();
  if (rows.length === 0) return result;
  const db = getDatabase();
  const links = await db.select().from(contentMedia).where(inArray(contentMedia.contentId, rows.map((row) => row.id)));
  if (links.length === 0) return result;
  const originals = await db.select().from(mediaAssets).where(inArray(mediaAssets.id, links.map((link) => link.mediaId)));
  const thumbnails = await db.select().from(mediaAssets).where(inArray(mediaAssets.parentAssetId, links.map((link) => link.mediaId)));
  for (const row of rows) {
    const images = links.filter((candidate) => candidate.contentId === row.id).sort((a, b) => a.sortOrder - b.sortOrder).map((link) => {
      const original = originals.find((asset) => asset.id === link.mediaId);
      const deliverable = thumbnails.find((asset) => asset.parentAssetId === link.mediaId) ?? original;
      return deliverable ? { url: `/api/media/${deliverable.id}`, alt: original?.altText || row.title } : null;
    }).filter((image): image is ContentImage => image !== null);
    result.set(row.id, images);
  }
  return result;
}

function mapLifeRecord(row: typeof contentItems.$inferSelect, images: ContentImage[] = []): LifeRecord {
  const image = images[0];
  return {
    id: row.id, ownerId: row.ownerId, title: row.title, excerpt: row.summary ?? "", body: row.body,
    occurredAt: row.happenedAt?.toISOString().slice(0, 10) ?? "", location: String(row.metadata.location ?? ""),
    mood: String(row.metadata.mood ?? ""), imageTone: String(row.metadata.imageTone ?? ""),
    tags: (row.metadata.tags as string[]) ?? [], isAiUsable: Boolean(row.metadata.isAiUsable),
    status: row.status, visibility: row.visibility, imageUrl: image?.url, imageAlt: image?.alt,
    updatedAt: row.updatedAt.toISOString(), images
  };
}

function mapStudyItem(row: typeof contentItems.$inferSelect, images: ContentImage[] = []): StudyItem {
  const image = images[0];
  return {
    id: row.id, ownerId: row.ownerId, type: String(row.metadata.studyType ?? "other"), title: row.title,
    summary: row.summary ?? "", body: row.body, period: String(row.metadata.period ?? ""),
    institution: String(row.metadata.institution ?? ""), tags: (row.metadata.tags as string[]) ?? [],
    isAiUsable: Boolean(row.metadata.isAiUsable), status: row.status, visibility: row.visibility,
    imageUrl: image?.url, imageAlt: image?.alt, updatedAt: row.updatedAt.toISOString(), images
  };
}

function mapWorkProject(row: typeof contentItems.$inferSelect, images: ContentImage[] = []): WorkProject {
  const image = images[0];
  return {
    id: row.id, ownerId: row.ownerId, title: row.title, summary: row.summary ?? "", body: row.body,
    role: String(row.metadata.role ?? ""), techStack: (row.metadata.techStack as string[]) ?? [],
    result: String(row.metadata.result ?? ""), period: String(row.metadata.period ?? ""),
    imageTone: String(row.metadata.imageTone ?? ""), tags: (row.metadata.tags as string[]) ?? [],
    isAiUsable: Boolean(row.metadata.isAiUsable), status: row.status, visibility: row.visibility,
    imageUrl: image?.url, imageAlt: image?.alt, updatedAt: row.updatedAt.toISOString(), images
  };
}

async function getRow(type: "life" | "study" | "work", id: string) {
  const [row] = await getDatabase().select().from(contentItems).where(and(
    eq(contentItems.ownerId, DEFAULT_OWNER_ID),
    eq(contentItems.type, type),
    eq(contentItems.id, id),
    eq(contentItems.status, "published"),
    eq(contentItems.visibility, "public")
  )).limit(1);
  return row ?? null;
}

export async function listLifeRecordsPage(options?: { limit?: number; cursor?: string | null }): Promise<ContentPage<LifeRecord>> {
  const page = await listRows("life", options);
  const images = await contentImages(page.rows);
  return { items: page.rows.map((row) => mapLifeRecord(row, images.get(row.id))), hasMore: page.hasMore, nextCursor: page.nextCursor };
}

export async function listLifeRecords(): Promise<LifeRecord[]> {
  return (await listLifeRecordsPage({ limit: MAX_PAGE_SIZE })).items;
}

export async function getLifeRecord(slug: string) {
  const row = await getRow("life", slug);
  if (!row) return undefined;
  const images = await contentImages([row]);
  return mapLifeRecord(row, images.get(row.id));
}

export async function listStudyItemsPage(options?: { limit?: number; cursor?: string | null }): Promise<ContentPage<StudyItem>> {
  const page = await listRows("study", options);
  const images = await contentImages(page.rows);
  return { items: page.rows.map((row) => mapStudyItem(row, images.get(row.id))), hasMore: page.hasMore, nextCursor: page.nextCursor };
}

export async function listStudyItems(): Promise<StudyItem[]> {
  return (await listStudyItemsPage({ limit: MAX_PAGE_SIZE })).items;
}

export async function getStudyItem(slug: string) {
  const row = await getRow("study", slug);
  if (!row) return undefined;
  const images = await contentImages([row]);
  return mapStudyItem(row, images.get(row.id));
}

export async function listWorkProjectsPage(options?: { limit?: number; cursor?: string | null }): Promise<ContentPage<WorkProject>> {
  const page = await listRows("work", options);
  const images = await contentImages(page.rows);
  return { items: page.rows.map((row) => mapWorkProject(row, images.get(row.id))), hasMore: page.hasMore, nextCursor: page.nextCursor };
}

export async function listWorkProjects(): Promise<WorkProject[]> {
  return (await listWorkProjectsPage({ limit: MAX_PAGE_SIZE })).items;
}

export async function getWorkProject(slug: string) {
  const row = await getRow("work", slug);
  if (!row) return undefined;
  const images = await contentImages([row]);
  return mapWorkProject(row, images.get(row.id));
}
