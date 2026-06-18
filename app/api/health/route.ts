import { NextResponse } from "next/server";
import { checkDatabase } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = await checkDatabase();
    const healthy = database.configured && database.reachable;
    return NextResponse.json({ status: healthy ? "ok" : "degraded", database }, { status: healthy ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      database: { configured: true, reachable: false },
      error: error instanceof Error ? error.message : "Unknown database error"
    }, { status: 503 });
  }
}
