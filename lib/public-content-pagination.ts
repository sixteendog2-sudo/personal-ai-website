import type { NextRequest } from "next/server";

export function readPublicContentPage(request: NextRequest) {
  const limitValue = request.nextUrl.searchParams.get("limit");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = limitValue === null ? 6 : Number(limitValue);

  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    return { error: "limit must be an integer between 1 and 20" } as const;
  }
  if (cursor !== null && !/^\d+$/.test(cursor)) {
    return { error: "cursor must be a non-negative integer" } as const;
  }
  return { limit, cursor } as const;
}
