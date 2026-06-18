import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createContactIntent } from "@/lib/contact-store";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getVisitorRateLimitKey } from "@/lib/request-context";

const contactIntentSchema = z.object({
  intent: z.enum(["admission", "social", "career", "collaboration", "other"]).default("other"),
  name: z.string().trim().min(1).max(120),
  contact: z.string().trim().min(3).max(255),
  message: z.string().trim().min(5).max(2000)
});

export async function POST(request: NextRequest) {
  const rate = await consumeRateLimit({ keyHash: getVisitorRateLimitKey(request), action: "contact.create", limit: 5, windowSeconds: 3600 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many contact requests" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const parsed = contactIntentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contact form", fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  const item = await createContactIntent({
    name: parsed.data.name,
    contact: parsed.data.contact,
    purpose: parsed.data.intent,
    message: parsed.data.message
  });
  return NextResponse.json({ item }, { status: 201 });
}
