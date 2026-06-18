import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/dashboard-store";

export async function GET() {
  return NextResponse.json({
    metrics: await getDashboardMetrics()
  });
}
