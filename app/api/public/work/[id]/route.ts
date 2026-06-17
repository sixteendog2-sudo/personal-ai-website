import { NextResponse } from "next/server";
import { workProjects } from "@/lib/mock-data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = workProjects.find((project) => project.id === id && project.visibility === "public" && project.status === "published");

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}
