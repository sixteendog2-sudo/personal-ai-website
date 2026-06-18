import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { contentItems } from "@/db/schema";
import { DEFAULT_OWNER_ID } from "@/lib/tenant";
import type { LifeRecord, StudyItem, WorkProject } from "@/lib/types";

async function listRows(type: "life" | "study" | "work") {
  return getDatabase().select().from(contentItems).where(and(
    eq(contentItems.ownerId, DEFAULT_OWNER_ID),
    eq(contentItems.type, type),
    eq(contentItems.status, "published"),
    eq(contentItems.visibility, "public")
  )).orderBy(desc(contentItems.happenedAt), desc(contentItems.createdAt));
}

export async function listLifeRecords(): Promise<LifeRecord[]> {
  return (await listRows("life")).map((row) => ({
    id: row.slug, ownerId: row.ownerId, title: row.title, excerpt: row.summary ?? "", body: row.body,
    occurredAt: row.happenedAt?.toISOString().slice(0, 10) ?? "", location: String(row.metadata.location ?? ""),
    mood: String(row.metadata.mood ?? ""), imageTone: String(row.metadata.imageTone ?? ""),
    tags: (row.metadata.tags as string[]) ?? [], isAiUsable: Boolean(row.metadata.isAiUsable),
    status: row.status, visibility: row.visibility
  }));
}

export async function getLifeRecord(slug: string) {
  return (await listLifeRecords()).find((item) => item.id === slug);
}

export async function listStudyItems(): Promise<StudyItem[]> {
  return (await listRows("study")).map((row) => ({
    id: row.slug, ownerId: row.ownerId, type: String(row.metadata.studyType ?? "other"), title: row.title,
    summary: row.summary ?? "", body: row.body, period: String(row.metadata.period ?? ""),
    institution: String(row.metadata.institution ?? ""), tags: (row.metadata.tags as string[]) ?? [],
    isAiUsable: Boolean(row.metadata.isAiUsable), status: row.status, visibility: row.visibility
  }));
}

export async function listWorkProjects(): Promise<WorkProject[]> {
  return (await listRows("work")).map((row) => ({
    id: row.slug, ownerId: row.ownerId, title: row.title, summary: row.summary ?? "", body: row.body,
    role: String(row.metadata.role ?? ""), techStack: (row.metadata.techStack as string[]) ?? [],
    result: String(row.metadata.result ?? ""), period: String(row.metadata.period ?? ""),
    imageTone: String(row.metadata.imageTone ?? ""), tags: (row.metadata.tags as string[]) ?? [],
    isAiUsable: Boolean(row.metadata.isAiUsable), status: row.status, visibility: row.visibility
  }));
}

export async function getWorkProject(slug: string) {
  return (await listWorkProjects()).find((item) => item.id === slug);
}
