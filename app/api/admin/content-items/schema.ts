import { z } from "zod";

export const contentWriteSchema = z.object({
  type: z.enum(["life", "study", "work"]),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(240),
  summary: z.string().trim().max(1000).nullish(),
  body: z.string().trim().max(100000).default(""),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  visibility: z.enum(["public", "private", "unlisted"]).default("private"),
  happenedAt: z.iso.datetime().nullish(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const contentPatchSchema = contentWriteSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});
