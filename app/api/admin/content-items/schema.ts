import { z } from "zod";

const contentFields = {
  type: z.enum(["life", "study", "work"]),
  title: z.string().trim().min(1).max(240),
  summary: z.string().trim().max(1000).nullish(),
  body: z.string().trim().max(100000),
  status: z.enum(["draft", "published", "archived"]),
  visibility: z.enum(["public", "private", "unlisted"]),
  happenedAt: z.iso.datetime().nullish(),
  metadata: z.record(z.string(), z.unknown())
};

export const contentWriteSchema = z.object({
  ...contentFields,
  body: contentFields.body.default(""),
  status: contentFields.status.default("draft"),
  visibility: contentFields.visibility.default("private"),
  metadata: contentFields.metadata.default({})
}).strict();

export const contentPatchSchema = z.object(contentFields).partial().strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});
