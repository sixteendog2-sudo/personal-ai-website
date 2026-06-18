import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth";

export async function getAdminRequestSession(request: NextRequest) {
  return verifyAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}
