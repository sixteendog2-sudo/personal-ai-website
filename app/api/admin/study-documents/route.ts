import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminContent } from "@/lib/admin-content-store";
import { getAdminRequestSession } from "@/lib/api-auth";
import { getRequestIpHash } from "@/lib/request-context";
import { contentWriteSchema } from "@/app/api/admin/content-items/schema";
import { DocumentValidationError, documentExtension, parseDocument } from "@/lib/document-parser";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const session = await getAdminRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const uploaded = formData.get("file");
  const file = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;
  const extension = file ? documentExtension(file.name) : "";
  let uploadedBody = "";
  try {
    uploadedBody = file ? (await parseDocument(file)).body : "";
  } catch (error) {
    if (error instanceof DocumentValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
  const body = field(formData, "body") || uploadedBody.trim();
  if (!body) return NextResponse.json({ error: "Document content is required" }, { status: 400 });

  const tags = field(formData, "tags").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
  const parsed = contentWriteSchema.safeParse({
    type: "study",
    title: field(formData, "title"),
    summary: field(formData, "summary") || null,
    body,
    status: field(formData, "status") || "draft",
    visibility: field(formData, "visibility") || "private",
    metadata: {
      studyType: field(formData, "studyType") || "document",
      period: field(formData, "period"),
      institution: field(formData, "institution"),
      tags,
      isAiUsable: field(formData, "isAiUsable") === "true",
      sourceFileName: file?.name ?? null,
      sourceFormat: extension || "editor"
    }
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid study document", fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }

  try {
    const item = await createAdminContent(
      { ...session, ipHash: getRequestIpHash(request) },
      { ...parsed.data, happenedAt: null }
    );
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    throw error;
  }
}
