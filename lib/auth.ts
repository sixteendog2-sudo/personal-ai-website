import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/config";

export const ADMIN_COOKIE_NAME = "personal_ai_admin";

export type AdminSession = {
  adminUserId: string;
  ownerId: string;
  role: string;
};

function sessionSecret() {
  if (!env.ADMIN_SESSION_TOKEN) throw new Error("ADMIN_SESSION_TOKEN is not configured");
  return new TextEncoder().encode(env.ADMIN_SESSION_TOKEN);
}

export async function createAdminSession(session: AdminSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer("personal-ai-website")
    .setAudience("personal-ai-admin")
    .sign(sessionSecret());
}

export async function verifyAdminSession(token?: string): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      issuer: "personal-ai-website",
      audience: "personal-ai-admin"
    });
    if (typeof payload.adminUserId !== "string" || typeof payload.ownerId !== "string" || typeof payload.role !== "string") return null;
    return { adminUserId: payload.adminUserId, ownerId: payload.ownerId, role: payload.role };
  } catch {
    return null;
  }
}
