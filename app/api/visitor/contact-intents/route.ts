import { NextResponse } from "next/server";

const intents: Array<{
  id: string;
  intent: string;
  name?: string;
  contact?: string;
  message?: string;
  createdAt: string;
}> = [];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    intent?: string;
    name?: string;
    contact?: string;
    message?: string;
  };

  const item = {
    id: crypto.randomUUID(),
    intent: body.intent ?? "other",
    name: body.name,
    contact: body.contact,
    message: body.message,
    createdAt: new Date().toISOString()
  };

  intents.unshift(item);
  return NextResponse.json({ item });
}

export async function GET() {
  return NextResponse.json({ items: intents });
}

