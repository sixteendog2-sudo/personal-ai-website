import type { ReactNode } from "react";

function renderInlineMarkdown(value: string, keyPrefix: string) {
  return value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-strong-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${keyPrefix}-code-${index}`}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let code: string[] | null = null;

  lines.forEach((line, index) => {
    if (line.trim().startsWith(String.fromCharCode(96).repeat(3))) {
      if (code) {
        nodes.push(<pre key={"code-" + index}><code>{code.join("\n")}</code></pre>);
        code = null;
      } else {
        code = [];
      }
      return;
    }
    if (code) {
      code.push(line);
      return;
    }
    if (!line.trim()) return;

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const text = renderInlineMarkdown(heading[2], `heading-${index}`);
      if (heading[1].length === 1) nodes.push(<h2 key={index}>{text}</h2>);
      else if (heading[1].length === 2) nodes.push(<h3 key={index}>{text}</h3>);
      else nodes.push(<h4 key={index}>{text}</h4>);
      return;
    }
    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem) {
      nodes.push(<ul key={index}><li>{renderInlineMarkdown(listItem[1], `list-${index}`)}</li></ul>);
      return;
    }
    if (line.startsWith("> ")) {
      nodes.push(<blockquote key={index}>{renderInlineMarkdown(line.slice(2), `quote-${index}`)}</blockquote>);
      return;
    }
    nodes.push(<p key={index}>{renderInlineMarkdown(line, `paragraph-${index}`)}</p>);
  });

  const unfinishedCode = code as string[] | null;
  if (unfinishedCode) nodes.push(<pre key="code-final"><code>{unfinishedCode.join("\n")}</code></pre>);
  return <div className="markdown-content">{nodes}</div>;
}
