import assert from "node:assert/strict";
import test from "node:test";
import { contentWriteSchema } from "../app/api/admin/content-items/schema";
import { knowledgeWriteSchema } from "../app/api/admin/knowledge-items/schema";

test("content schema accepts stable slugs and rejects path-like slugs", () => {
  const valid = contentWriteSchema.safeParse({ type: "life", slug: "life-2026-01", title: "Entry" });
  const invalid = contentWriteSchema.safeParse({ type: "life", slug: "../private", title: "Entry" });
  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});

test("knowledge schema defaults new content to private draft and not AI usable", () => {
  const result = knowledgeWriteSchema.parse({ title: "Title", category: "Notes", body: "Body" });
  assert.equal(result.visibility, "private");
  assert.equal(result.status, "draft");
  assert.equal(result.isAiUsable, false);
});
