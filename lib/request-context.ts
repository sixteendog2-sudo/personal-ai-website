import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { env } from "@/lib/config";

export function getRequestIpHash(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}:${env.ADMIN_SESSION_TOKEN ?? "local"}`).digest("hex");
}

export function getVisitorRateLimitKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}:${userAgent}:${env.ADMIN_SESSION_TOKEN ?? "local"}`).digest("hex");
}
