"use client";

import { useEffect, useState } from "react";
import type { VisitorQuestion } from "@/lib/types";

export function QuestionsClient() {
  const [questions, setQuestions] = useState<VisitorQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadQuestions() {
    setLoading(true);
    const response = await fetch("/api/admin/visitor-questions", { cache: "no-store" });
    const payload = (await response.json()) as { items: VisitorQuestion[] };
    setQuestions(payload.items);
    setLoading(false);
  }

  async function convert(questionId: string) {
    setMessage("");
    const response = await fetch(`/api/admin/visitor-questions/${questionId}/convert-to-knowledge`, {
      method: "POST"
    });

    if (!response.ok) {
      setMessage("示例问题不可转换；请先到访客端真实提问一次。");
      return;
    }

    setMessage("已转为知识库条目，后续聊天可检索引用。");
    await loadQuestions();
  }

  useEffect(() => {
    void loadQuestions();
  }, []);

  return (
    <section className="admin-card">
      {message ? <p className="chip cyan">{message}</p> : null}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>正在加载访客问题...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>问题</th>
              <th>主题</th>
              <th>状态</th>
              <th>AI 原回答</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((item) => (
              <tr key={item.id}>
                <td>{item.question}</td>
                <td>{item.topic}</td>
                <td>
                  <span className={item.status === "converted" ? "chip lime" : item.status === "new" ? "chip coral" : "chip"}>
                    {item.status}
                  </span>
                </td>
                <td>{item.answer}</td>
                <td>
                  <button className="button secondary" type="button" onClick={() => convert(item.id)} disabled={item.status === "converted"}>
                    问题转知识
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

