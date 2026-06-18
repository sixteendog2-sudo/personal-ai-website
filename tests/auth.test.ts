import assert from "node:assert/strict";
import test from "node:test";

test("signed admin sessions verify and tampered sessions fail", async () => {
  process.env.ADMIN_SESSION_TOKEN = "test-session-secret-with-at-least-32-characters";
  const { createAdminSession, verifyAdminSession } = await import("../lib/auth");
  const input = { adminUserId: "admin-id", ownerId: "owner-id", role: "owner" };
  const token = await createAdminSession(input);
  assert.deepEqual(await verifyAdminSession(token), input);

  const parts = token.split(".");
  parts[1] = `${parts[1][0] === "a" ? "b" : "a"}${parts[1].slice(1)}`;
  assert.equal(await verifyAdminSession(parts.join(".")), null);
});
