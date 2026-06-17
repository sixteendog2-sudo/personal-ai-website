import { NextResponse } from "next/server";
import { lifeRecords } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    items: lifeRecords.filter((item) => item.visibility === "public" && item.status === "published")
  });
}

