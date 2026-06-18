import { z } from "zod";

export const knowledgeWriteSchema = z.object({
  title: z.string().trim().min(1).max(240), category: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(200000), tags: z.array(z.string().trim().min(1).max(50)).max(50).default([]),
  sourceType: z.enum(["manual", "profile", "study_item", "work_project", "life_record", "visitor_question", "chat_summary"]).default("manual"),
  sourceId: z.string().trim().max(200).nullish(), visibility: z.enum(["public", "private", "unlisted"]).default("private"),
  status: z.enum(["draft", "published", "archived"]).default("draft"), isAiUsable: z.boolean().default(false)
});

export const knowledgePatchSchema = knowledgeWriteSchema.partial().refine((value) => Object.keys(value).length > 0);
