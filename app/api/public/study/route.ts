import { NextResponse } from "next/server";
import { listStudyItems } from "@/lib/content-store";

export async function GET() {
  return NextResponse.json({
    items: await listStudyItems()
  });
}
