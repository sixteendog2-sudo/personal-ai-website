import { NextResponse } from "next/server";
import { listWorkProjects } from "@/lib/content-store";

export async function GET() {
  return NextResponse.json({
    items: await listWorkProjects()
  });
}
