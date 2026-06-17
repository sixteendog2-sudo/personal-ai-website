import { NextResponse } from "next/server";
import { lifeRecords } from "@/lib/mock-data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = lifeRecords.find((record) => record.id === id && record.visibility === "public" && record.status === "published");

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}
