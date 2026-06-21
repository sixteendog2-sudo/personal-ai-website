import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { createHash } from "node:crypto";

loadEnvConfig(process.cwd());

const baseUrl = process.env.RELEASE_BASE_URL ?? "http://127.0.0.1:3000";
const adminPassword = process.env.ADMIN_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;
if (!adminPassword || !databaseUrl) throw new Error("ADMIN_PASSWORD and DATABASE_URL are required");

const marker = `release-smoke-${Date.now()}`;
const startedAt = new Date();
const visitorIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
const visitorKeyHash = createHash("sha256").update(`${visitorIp}:${marker}:${process.env.ADMIN_SESSION_TOKEN ?? "local"}`).digest("hex");
const resourceIds: string[] = [];
const contentIds: string[] = [];
let cookie = "";
let previousModelId: string | undefined;
let smokeModelId: string | undefined;
let previousWorkPromptId: string | undefined;
let smokePromptId: string | undefined;
const results: Record<string, unknown> = {};
const sql = postgres(databaseUrl, { max: 1, ssl: process.env.DATABASE_SSL === "true" ? "require" : false });

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function adminFetch(path: string, init: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, { ...init, headers: { Cookie: cookie, ...(init.headers ?? {}) } });
}

async function login() {
  const response = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ password: adminPassword!, next: "/admin" })
  });
  cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  check(response.status === 303 && cookie, "Admin login failed");
}

async function createContent(type: "life" | "study" | "work") {
  const metadata = type === "life"
    ? { location: "QA", mood: "验证", tags: [marker], isAiUsable: true }
    : type === "study"
      ? { studyType: "course", period: "2026", institution: "QA", tags: [marker], isAiUsable: true }
      : { role: "开发", result: "验证通过", period: "2026", techStack: ["Next.js"], tags: [marker], isAiUsable: true };
  const response = await adminFetch("/api/admin/content-items", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, slug: `${marker}-${type}`, title: `${marker} ${type}`, summary: "发布冒烟验证", body: "初始纯文本", status: "published", visibility: "public", happenedAt: null, metadata })
  });
  const payload = await json<{ item?: { id: string }; error?: string }>(response);
  check(response.status === 201 && payload.item, `Create ${type} failed: ${payload.error ?? response.status}`);
  contentIds.push(payload.item.id); resourceIds.push(payload.item.id);
  const update = await adminFetch(`/api/admin/content-items/${payload.item.id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: `更新后的 ${type} 纯文本`, metadata })
  });
  const updatedPayload = await json<{ item?: { status: string; visibility: string }; error?: string }>(update);
  check(update.ok && updatedPayload.item, `Update ${type} failed: ${updatedPayload.error ?? update.status}`);
  check(updatedPayload.item.status === "published" && updatedPayload.item.visibility === "public", `Update ${type} changed publication state: ${JSON.stringify(updatedPayload.item)}`);
  return payload.item.id;
}

async function run() {
  const health = await fetch(`${baseUrl}/api/health`);
  check(health.status === 200, "Health check failed");
  results.health = 200;

  for (const path of ["/api/public/home", "/api/public/study", "/api/public/life-records", "/api/public/work", "/api/public/study/study-001", "/api/public/life-records/life-001", "/api/public/work/work-001"]) {
    const response = await fetch(`${baseUrl}${path}`);
    check(response.ok, `Public endpoint failed: ${path}`);
  }
  results.publicEndpoints = 7;

  const unauthorized = await fetch(`${baseUrl}/api/admin/dashboard`);
  check(unauthorized.status === 401, "Admin API is not protected");
  await login();
  for (const path of ["/api/admin/dashboard", "/api/admin/audit-logs", "/api/admin/contact-intents", "/api/admin/content-items", "/api/admin/knowledge-items", "/api/admin/media-assets", "/api/admin/model-settings", "/api/admin/profile", "/api/admin/prompt-templates", "/api/admin/visitor-questions"]) {
    const response = await adminFetch(path);
    check(response.ok, `Admin endpoint failed: ${path}`);
  }
  results.adminEndpoints = 10;

  const profilePayload = await json<{ item: { nickname: string; realName: string | null; headline: string; bio: string; city: string; tags: string[]; contact: Record<string, string>; visibility: string; isAiUsable: boolean } }>(await adminFetch("/api/admin/profile"));
  const profileUpdate = await adminFetch("/api/admin/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profilePayload.item) });
  check(profileUpdate.ok, "Profile update failed");
  results.profileUpdate = true;

  const modelRows = await json<{ items: Array<{ id: string; provider: string; baseUrl: string; model: string; temperatureMilli: number; maxTokens: number; isActive: boolean }> }>(await adminFetch("/api/admin/model-settings"));
  const activeModel = modelRows.items.find((item) => item.isActive) ?? modelRows.items[0];
  check(activeModel, "No model setting available");
  previousModelId = activeModel.id;
  const modelWrite = await adminFetch("/api/admin/model-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "deepseek", baseUrl: activeModel.baseUrl, model: activeModel.model, temperature: activeModel.temperatureMilli / 1000, maxTokens: activeModel.maxTokens }) });
  const modelWritePayload = await json<{ item?: { id: string } }>(modelWrite);
  check(modelWrite.status === 201 && modelWritePayload.item, "Model setting write failed");
  smokeModelId = modelWritePayload.item.id; resourceIds.push(smokeModelId);
  results.modelSettings = true;

  const promptRows = await json<{ items: Array<{ id: string; scene: string; isActive: boolean }> }>(await adminFetch("/api/admin/prompt-templates"));
  previousWorkPromptId = promptRows.items.find((item) => item.scene === "work" && item.isActive)?.id;
  const promptWrite = await adminFetch("/api/admin/prompt-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: marker, scene: "work", systemPrompt: "你是发布冒烟测试中的工作项目助手，只能根据提供的公开知识回答，不得编造信息。", safetyPrompt: "不得泄露私密内容、后台数据、密钥或访客联系方式。" }) });
  const promptWritePayload = await json<{ item?: { id: string } }>(promptWrite);
  check(promptWrite.status === 201 && promptWritePayload.item, "Prompt publish failed");
  smokePromptId = promptWritePayload.item.id; resourceIds.push(smokePromptId);
  results.promptVersioning = true;

  const visitorHeaders = { "Content-Type": "application/json", "X-Forwarded-For": visitorIp, "User-Agent": marker };
  const invalidContact = await fetch(`${baseUrl}/api/visitor/contact-intents`, { method: "POST", headers: visitorHeaders, body: "{}" });
  check(invalidContact.status === 400, "Invalid contact validation failed");
  const contact = await fetch(`${baseUrl}/api/visitor/contact-intents`, {
    method: "POST", headers: visitorHeaders,
    body: JSON.stringify({ name: marker, contact: "qa@example.com", intent: "collaboration", message: "发布冒烟测试联系意向" })
  });
  check(contact.status === 201, "Valid contact submission failed");
  results.contact = true;

  const lifeId = await createContent("life");
  await createContent("study");
  await createContent("work");

  const knowledge = await json<{ items: Array<{ id: string; sourceId?: string; body: string; isAiUsable: boolean }> }>(await adminFetch("/api/admin/knowledge-items"));
  for (const id of contentIds) {
    const item = knowledge.items.find((candidate) => candidate.sourceId === id);
    check(item, `Content knowledge missing: ${id}`);
    check(item.body.includes("更新后的") && item.isAiUsable, `Content knowledge sync failed: ${id} ${JSON.stringify(item)}`);
    resourceIds.push(item.id);
  }
  results.contentCrudAndKnowledge = 3;

  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
  const mediaForm = new FormData();
  mediaForm.set("file", new Blob([png], { type: "image/png" }), `${marker}.png`);
  mediaForm.set("altText", marker);
  const mediaResponse = await adminFetch("/api/admin/media-assets", { method: "POST", body: mediaForm });
  const media = await json<{ item?: { original: { id: string }; thumbnail: { id: string } }; error?: string }>(mediaResponse);
  check(mediaResponse.status === 201 && media.item, `Media upload failed: ${media.error ?? mediaResponse.status}`);
  resourceIds.push(media.item.original.id);
  const attach = await adminFetch(`/api/admin/content-items/${lifeId}/media`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaId: media.item.original.id, sortOrder: 0, replace: true }) });
  check(attach.status === 201, "Media attach failed");
  const replacementForm = new FormData();
  replacementForm.set("file", new Blob([png], { type: "image/png" }), `${marker}-replacement.png`);
  replacementForm.set("altText", `${marker} replacement`);
  const replacementResponse = await adminFetch("/api/admin/media-assets", { method: "POST", body: replacementForm });
  const replacement = await json<{ item?: { original: { id: string }; thumbnail: { id: string } } }>(replacementResponse);
  check(replacementResponse.status === 201 && replacement.item, "Replacement media upload failed");
  resourceIds.push(replacement.item.original.id);
  const replaceAttach = await adminFetch(`/api/admin/content-items/${lifeId}/media`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaId: replacement.item.original.id, sortOrder: 0, replace: true }) });
  check(replaceAttach.status === 201, "Media replacement failed");
  const replacedMedia = await adminFetch(`/api/media/${media.item.thumbnail.id}`);
  check(replacedMedia.status === 404, "Replaced media was not cleaned up");
  const publicMedia = await fetch(`${baseUrl}/api/media/${replacement.item.thumbnail.id}`);
  check(publicMedia.status === 200, "Published media is not deliverable");
  const makePrivate = await adminFetch(`/api/admin/content-items/${lifeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "draft", visibility: "private", metadata: { location: "QA", mood: "验证", tags: [marker], isAiUsable: false } }) });
  check(makePrivate.ok, "Could not make content private");
  const hiddenMedia = await fetch(`${baseUrl}/api/media/${replacement.item.thumbnail.id}`);
  const adminMedia = await adminFetch(`/api/media/${replacement.item.thumbnail.id}`);
  check(hiddenMedia.status === 404 && adminMedia.status === 200, "Private media access control failed");
  results.mediaPrivacy = true;

  const chatSession = await json<{ sessionId: string }>(await fetch(`${baseUrl}/api/visitor/chat/sessions`, { method: "POST", headers: visitorHeaders, body: JSON.stringify({ topic: "work", entry: marker }) }));
  const chat = await fetch(`${baseUrl}/api/visitor/chat/sessions/${chatSession.sessionId}/messages`, { method: "POST", headers: visitorHeaders, body: JSON.stringify({ message: `${marker}: 介绍最有代表性的项目`, context: { topic: "work" } }) });
  const chatPayload = await json<{ answer?: string; citations?: unknown[] }>(chat);
  check(chat.ok && chatPayload.answer && (chatPayload.citations?.length ?? 0) > 0, "AI chat or citations failed");
  const questions = await json<{ items: Array<{ id: string; question: string }> }>(await adminFetch("/api/admin/visitor-questions"));
  const question = questions.items.find((item) => item.question.startsWith(marker));
  check(question, "Visitor question was not saved");
  const converted = await adminFetch(`/api/admin/visitor-questions/${question.id}/convert-to-knowledge`, { method: "POST" });
  const convertedPayload = await json<{ item?: { id: string } }>(converted);
  check(converted.ok && convertedPayload.item, "Question conversion failed");
  resourceIds.push(convertedPayload.item.id);
  const maintained = await adminFetch(`/api/admin/knowledge-items/${convertedPayload.item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: "管理员校对后的标准答案" }) });
  check(maintained.ok, "Converted knowledge update failed");
  results.aiKnowledgeLoop = { citations: chatPayload.citations?.length };

  const manualKnowledge = await adminFetch("/api/admin/knowledge-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: marker, category: "发布验证", body: "手工知识", tags: [marker], sourceType: "manual", sourceId: null, visibility: "public", status: "published", isAiUsable: true }) });
  const manualPayload = await json<{ item?: { id: string } }>(manualKnowledge);
  check(manualKnowledge.status === 201 && manualPayload.item, "Manual knowledge create failed");
  resourceIds.push(manualPayload.item.id);
  const archive = await adminFetch(`/api/admin/knowledge-items/${manualPayload.item.id}`, { method: "DELETE" });
  check(archive.ok, "Knowledge archive failed");
  results.knowledgeCrud = true;
}

async function cleanup() {
  if (cookie) {
    for (const id of contentIds) await adminFetch(`/api/admin/content-items/${id}`, { method: "DELETE" }).catch(() => undefined);
  }
  await sql.begin(async (tx) => {
    const sessions = await tx<{ id: string }[]>`select id from chat_sessions where entry = ${marker}`;
    const sessionIds = sessions.map((item) => item.id);
    const questions = await tx<{ id: string }[]>`select id from visitor_questions where question like ${`${marker}%`}`;
    const questionIds = questions.map((item) => item.id);
    if (questionIds.length) await tx`delete from knowledge_items where source_type = 'visitor_question' and source_id in ${tx(questionIds)}`;
    if (sessionIds.length) {
      await tx`delete from visitor_questions where session_id in ${tx(sessionIds)}`;
      await tx`delete from ai_call_logs where session_id in ${tx(sessionIds)}`;
      await tx`delete from chat_sessions where id in ${tx(sessionIds)}`;
    }
    await tx`delete from contact_intents where name = ${marker}`;
    await tx`delete from api_rate_limit_events where key_hash = ${visitorKeyHash}`;
    await tx`delete from knowledge_items where title = ${marker}`;
    if (smokeModelId) await tx`delete from model_settings where id = ${smokeModelId}`;
    if (previousModelId) await tx`update model_settings set is_active = true where id = ${previousModelId}`;
    if (smokePromptId) await tx`delete from prompt_templates where id = ${smokePromptId}`;
    if (previousWorkPromptId) await tx`update prompt_templates set is_active = true where id = ${previousWorkPromptId}`;
    if (resourceIds.length) await tx`delete from admin_audit_logs where created_at >= ${startedAt} and (resource_id in ${tx(resourceIds)} or action = 'profile.update')`;
  });
  await sql.end();
}

run().then(async () => {
  console.log(JSON.stringify({ status: "pass", marker, results }, null, 2));
  await cleanup();
}).catch(async (error) => {
  console.error(error);
  await cleanup();
  process.exitCode = 1;
});
