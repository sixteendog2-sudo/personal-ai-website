const maxChunkLength = 800;
const overlapLength = 100;

export function chunkKnowledgeText(input: string) {
  const paragraphs = input.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  function flush() {
    if (current) chunks.push(current);
    current = "";
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkLength) {
      flush();
      for (let start = 0; start < paragraph.length; start += maxChunkLength - overlapLength) {
        chunks.push(paragraph.slice(start, start + maxChunkLength));
        if (start + maxChunkLength >= paragraph.length) break;
      }
      continue;
    }
    const combined = current ? `${current}\n\n${paragraph}` : paragraph;
    if (combined.length > maxChunkLength) {
      flush();
      current = paragraph;
    } else {
      current = combined;
    }
  }
  flush();
  return chunks.length ? chunks : [input.trim()].filter(Boolean);
}

export function estimateTokenCount(text: string) {
  const asciiWords = text.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const nonAsciiChars = text.replace(/[\x00-\x7F]/g, "").length;
  return Math.max(1, asciiWords + Math.ceil(nonAsciiChars / 1.5));
}
