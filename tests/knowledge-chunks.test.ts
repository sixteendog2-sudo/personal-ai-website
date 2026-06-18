import assert from "node:assert/strict";
import test from "node:test";
import { chunkKnowledgeText, estimateTokenCount } from "../lib/knowledge-chunks";

test("keeps short paragraphs together", () => {
  assert.deepEqual(chunkKnowledgeText("first paragraph\n\nsecond paragraph"), ["first paragraph\n\nsecond paragraph"]);
});

test("splits long text with overlap and bounded chunks", () => {
  const text = "A".repeat(1700);
  const chunks = chunkKnowledgeText(text);
  assert.equal(chunks.length, 3);
  assert.ok(chunks.every((chunk) => chunk.length <= 800));
  assert.equal(chunks[0].slice(-100), chunks[1].slice(0, 100));
});

test("estimates at least one token", () => {
  assert.equal(estimateTokenCount(""), 1);
  assert.ok(estimateTokenCount("hello world") >= 2);
});
