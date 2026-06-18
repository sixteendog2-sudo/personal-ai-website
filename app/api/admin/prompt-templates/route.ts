import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminRequestSession } from "@/lib/api-auth";
import { getRequestIpHash } from "@/lib/request-context";
import { listPromptTemplates, publishPromptTemplate } from "@/lib/settings-store";

const promptSchema = z.object({
  name: z.string().trim().min(1).max(120), scene: z.enum(["default", "study", "life", "work", "admission", "career", "social"]),
  systemPrompt: z.string().trim().min(20).max(20000), safetyPrompt: z.string().trim().max(10000).default("")
});

export async function GET(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: await listPromptTemplates(session.ownerId) });
}

export async function POST(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = promptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid prompt", fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  const item = await publishPromptTemplate({ ...session, ipHash: getRequestIpHash(request) }, parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
