import { NextResponse } from "next/server";
import { listLifeRecords } from "@/lib/content-store";

export async function GET() {
  return NextResponse.json({
    items: await listLifeRecords()
  });
}
