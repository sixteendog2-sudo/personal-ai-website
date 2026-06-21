import { z } from "zod";

const knowledgeFields = {
  title: z.string().trim().min(1).max(240), category: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(200000), tags: z.array(z.string().trim().min(1).max(50)).max(50),
  sourceType: z.enum(["manual", "profile", "study_item", "work_project", "life_record", "visitor_question", "chat_summary"]),
  sourceId: z.string().trim().max(200).nullish(), visibility: z.enum(["public", "private", "unlisted"]),
  status: z.enum(["draft", "published", "archived"]), isAiUsable: z.boolean()
};

export const knowledgeWriteSchema = z.object({
  ...knowledgeFields,
  tags: knowledgeFields.tags.default([]),
  sourceType: knowledgeFields.sourceType.default("manual"),
  visibility: knowledgeFields.visibility.default("private"),
  status: knowledgeFields.status.default("draft"),
  isAiUsable: knowledgeFields.isAiUsable.default(false)
});

export const knowledgePatchSchema = z.object(knowledgeFields).partial().refine((value) => Object.keys(value).length > 0);
