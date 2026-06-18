import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { readPublicContentPage } from "../lib/public-content-pagination";

test("public pagination defaults to six items", () => {
  assert.deepEqual(readPublicContentPage(new NextRequest("http://localhost/api/public/study")), {
    limit: 6,
    cursor: null
  });
});

test("public pagination accepts a bounded limit and numeric cursor", () => {
  assert.deepEqual(readPublicContentPage(new NextRequest("http://localhost/api/public/study?limit=12&cursor=24")), {
    limit: 12,
    cursor: "24"
  });
});

test("public pagination rejects invalid limits and cursors", () => {
  assert.ok("error" in readPublicContentPage(new NextRequest("http://localhost/api/public/study?limit=21")));
  assert.ok("error" in readPublicContentPage(new NextRequest("http://localhost/api/public/study?cursor=next")));
});
