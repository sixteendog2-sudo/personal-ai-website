import { NextRequest, NextResponse } from "next/server";
import { getAdminRequestSession } from "@/lib/api-auth";
import { DocumentValidationError, parseDocument } from "@/lib/document-parser";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "请选择文档" }, { status: 400 });
  try {
    return NextResponse.json(await parseDocument(file));
  } catch (error) {
    if (error instanceof DocumentValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
