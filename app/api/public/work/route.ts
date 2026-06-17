import { NextResponse } from "next/server";
import { workProjects } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    items: workProjects.filter((item) => item.visibility === "public" && item.status === "published")
  });
}

