import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminSessionToken, isValidAdminPassword } from "@/lib/auth";

function safeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/admin")) {
    return "/admin";
  }
  if (value.startsWith("/admin/login")) {
    return "/admin";
  }
  return value;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const nextPath = safeNextPath(form.get("next"));
  const url = new URL(request.url);

  if (!isValidAdminPassword(password)) {
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("error", "1");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url, { status: 303 });
  }

  url.pathname = nextPath;
  url.search = "";

  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.set(ADMIN_COOKIE_NAME, getAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}

