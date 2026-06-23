import mammoth from "mammoth";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_EXTENSIONS = new Set(["md", "markdown", "txt", "docx"]);

export class DocumentValidationError extends Error {}

export function documentExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export async function parseDocument(file: File) {
  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) throw new DocumentValidationError("文档必须小于 10 MB");
  const extension = documentExtension(file.name);
  if (!DOCUMENT_EXTENSIONS.has(extension)) throw new DocumentValidationError("仅支持 Markdown、TXT 和 Word (.docx) 文档");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    const body = result.value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!body) throw new DocumentValidationError("Word 文档中没有可读取的正文");
    return { body, extension, warnings: result.messages.map((message) => message.message) };
  }
  const body = new TextDecoder("utf-8", { fatal: false }).decode(buffer).replace(/^\uFEFF/, "").trim();
  if (!body) throw new DocumentValidationError("文档正文为空");
  return { body, extension, warnings: [] as string[] };
}
