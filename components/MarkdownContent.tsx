import type { ReactNode } from "react";

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
      const text = heading[2];
      if (heading[1].length === 1) nodes.push(<h2 key={index}>{text}</h2>);
      else if (heading[1].length === 2) nodes.push(<h3 key={index}>{text}</h3>);
      else nodes.push(<h4 key={index}>{text}</h4>);
      return;
    }
    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem) {
      nodes.push(<ul key={index}><li>{listItem[1]}</li></ul>);
      return;
    }
    if (line.startsWith("> ")) {
      nodes.push(<blockquote key={index}>{line.slice(2)}</blockquote>);
      return;
    }
    nodes.push(<p key={index}>{line}</p>);
  });

  const unfinishedCode = code as string[] | null;
  if (unfinishedCode) nodes.push(<pre key="code-final"><code>{unfinishedCode.join("\n")}</code></pre>);
  return <div className="markdown-content">{nodes}</div>;
}
