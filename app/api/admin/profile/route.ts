import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminRequestSession } from "@/lib/api-auth";
import { getRequestIpHash } from "@/lib/request-context";
import { getOwnerProfile, updateOwnerProfile } from "@/lib/settings-store";

const profileSchema = z.object({
  nickname: z.string().trim().min(1).max(120).optional(), realName: z.string().trim().max(120).nullish(),
  headline: z.string().trim().max(300).optional(), bio: z.string().trim().max(10000).optional(),
  city: z.string().trim().max(120).optional(), tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  contact: z.object({ email: z.email().optional(), github: z.url().optional(), wechat: z.string().trim().max(120).optional() }).optional(),
  visibility: z.enum(["public", "private", "unlisted"]).optional(), isAiUsable: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0);

export async function GET(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ item: await getOwnerProfile(session.ownerId) });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile", fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  const item = await updateOwnerProfile({ ...session, ipHash: getRequestIpHash(request) }, parsed.data);
  return item ? NextResponse.json({ item }) : NextResponse.json({ error: "Profile not found" }, { status: 404 });
}
