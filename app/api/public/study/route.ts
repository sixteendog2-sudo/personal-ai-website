import { NextRequest, NextResponse } from "next/server";
import { listStudyItemsPage } from "@/lib/content-store";
import { readPublicContentPage } from "@/lib/public-content-pagination";

export async function GET(request: NextRequest) {
  const page = readPublicContentPage(request);
  if ("error" in page) return NextResponse.json({ error: page.error }, { status: 400 });
  return NextResponse.json(await listStudyItemsPage(page));
}
