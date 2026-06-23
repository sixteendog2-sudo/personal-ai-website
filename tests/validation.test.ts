import assert from "node:assert/strict";
import test from "node:test";
import { contentPatchSchema, contentWriteSchema } from "../app/api/admin/content-items/schema";
import { knowledgePatchSchema, knowledgeWriteSchema } from "../app/api/admin/knowledge-items/schema";

test("content schema no longer accepts a client supplied access path", () => {
  const valid = contentWriteSchema.safeParse({ type: "life", title: "Entry" });
  const invalid = contentWriteSchema.safeParse({ type: "life", slug: "life-2026-01", title: "Entry" });
  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});

test("content IDs are server-generated and client supplied IDs are rejected", () => {
  const parsed = contentWriteSchema.safeParse({
    id: "00000000-0000-4000-8000-000000000099",
    type: "life",
    title: "Server generated id"
  });
  assert.equal(parsed.success, false);
});

test("knowledge schema defaults new content to private draft and not AI usable", () => {
  const result = knowledgeWriteSchema.parse({ title: "Title", category: "Notes", body: "Body" });
  assert.equal(result.visibility, "private");
  assert.equal(result.status, "draft");
  assert.equal(result.isAiUsable, false);
});

test("content patches do not apply create defaults to omitted fields", () => {
  const result = contentPatchSchema.parse({ body: "Updated body" });
  assert.deepEqual(result, { body: "Updated body" });
});

test("knowledge patches preserve omitted publication and AI settings", () => {
  const result = knowledgePatchSchema.parse({ body: "Updated knowledge" });
  assert.deepEqual(result, { body: "Updated knowledge" });
});
