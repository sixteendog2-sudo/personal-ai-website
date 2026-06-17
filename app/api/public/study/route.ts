import { NextResponse } from "next/server";
import { studyItems } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    items: studyItems.filter((item) => item.visibility === "public" && item.status === "published")
  });
}

