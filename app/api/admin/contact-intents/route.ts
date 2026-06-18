import { NextResponse } from "next/server";
import { listContactIntents } from "@/lib/contact-store";

export async function GET() {
  return NextResponse.json({ items: await listContactIntents() });
}
