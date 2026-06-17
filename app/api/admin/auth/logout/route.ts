import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/admin/login";
  url.search = "";

  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}

