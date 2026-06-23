import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminRequestSession } from "@/lib/api-auth";
import { getRequestIpHash } from "@/lib/request-context";
import { activateModelSetting, listModelSettings } from "@/lib/settings-store";

const modelSchema = z.object({
  provider: z.string().trim().min(1).max(50),
  baseUrl: z.url().refine((value) => new URL(value).protocol === "https:", "HTTPS is required"),
  model: z.string().trim().min(1).max(120),
  apiKey: z.string().trim().max(500).optional(),
  keepExistingApiKey: z.boolean().default(false),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(64).max(32000)
});

export async function GET(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: await listModelSettings(session.ownerId) });
}

export async function PUT(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = modelSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid model setting", fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  const item = await activateModelSetting({ ...session, ipHash: getRequestIpHash(request) }, {
    provider: parsed.data.provider, baseUrl: parsed.data.baseUrl, model: parsed.data.model,
    temperatureMilli: Math.round(parsed.data.temperature * 1000), maxTokens: parsed.data.maxTokens,
    apiKey: parsed.data.apiKey || undefined, keepExistingApiKey: parsed.data.keepExistingApiKey
  });
  return NextResponse.json({ item }, { status: 201 });
}
