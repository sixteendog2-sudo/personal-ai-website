"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Send } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { Citation, Topic } from "@/lib/types";

type UiMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

const suggestions = [
  "你是谁？",
  "介绍一下你的项目经历",
  "你适合什么研究方向？",
  "平时有什么兴趣和生活记录？",
  "这个网站能帮助你求职吗？"
];

function normalizeTopic(value: string | null): Topic {
  if (value === "study" || value === "life" || value === "work" || value === "admission" || value === "career" || value === "social") {
    return value;
  }
  return "default";
}

export function ChatClient() {
  const searchParams = useSearchParams();
  const topic = normalizeTopic(searchParams.get("topic"));
  const recordId = searchParams.get("recordId") ?? undefined;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "assistant",
      content: "你好，我是这个个人网站里的 AI 分身。你可以问我学习、生活、工作、项目经历或联系方式。我会优先基于公开知识库回答。"
    }
  ]);

  const topicLabel = useMemo(() => {
    return {
      default: "综合咨询",
      study: "学习成长",
      life: "生活记录",
      work: "工作项目",
      admission: "升学咨询",
      career: "求职咨询",
      social: "社交破冰"
    }[topic];
  }, [topic]);

  async function ensureSession() {
    if (sessionId) {
      return sessionId;
    }

    const response = await fetch("/api/visitor/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, entry: "chat", relatedRecordId: recordId })
    });
    const payload = (await response.json()) as { sessionId: string };
    setSessionId(payload.sessionId);
    return payload.sessionId;
  }

  async function sendMessage(nextInput: string) {
    const text = nextInput.trim();
    if (!text || loading) {
      return;
    }

    setInput("");
    setMessages((current) => [...current, { role: "user", content: text }]);
    setLoading(true);

    try {
      const id = await ensureSession();
      const response = await fetch(`/api/visitor/chat/sessions/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: { topic, relatedRecordId: recordId }
        })
      });
      const payload = (await response.json()) as { answer: string; citations?: Citation[] };
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.answer,
          citations: payload.citations ?? []
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "聊天接口暂时不可用，但页面和 API 结构已经准备好。"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  return (
    <section className="container chat-shell">
      <aside className="chat-sidebar">
        <div className="eyebrow">{topicLabel}</div>
        <h2>推荐问题</h2>
        <p className="prose">这些问题会被保存到访客问题池，后续可以被管理员整理成知识库。</p>
        <div className="chips">
          {suggestions.map((item) => (
            <button className="chip" key={item} type="button" onClick={() => sendMessage(item)}>
              {item}
            </button>
          ))}
        </div>
      </aside>
      <div className="chat-main">
        <div className="chat-header">
          <h2 style={{ margin: 0 }}>
            <Bot size={22} /> 与虚拟的我对话
          </h2>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>Demo 会优先检索公开知识库；未配置 DeepSeek Key 时使用本地模拟回答。</p>
        </div>
        <div className="messages">
          {messages.map((message, index) => (
            <div className={`bubble ${message.role}`} key={`${message.role}-${index}`}>
              {message.role === "assistant" ? <MarkdownContent content={message.content} /> : message.content}
              {message.citations?.length ? (
                <div className="citation">
                  参考：{message.citations.map((citation) => `《${citation.title}》`).join("、")}
                </div>
              ) : null}
            </div>
          ))}
          {loading ? <div className="bubble assistant">正在基于知识库组织回答...</div> : null}
        </div>
        <form className="chat-input" onSubmit={onSubmit}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入你想了解的问题..." />
          <button className="button" type="submit" disabled={loading}>
            <Send size={16} />
            发送
          </button>
        </form>
      </div>
    </section>
  );
}
