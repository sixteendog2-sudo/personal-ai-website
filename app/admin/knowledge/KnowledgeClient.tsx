"use client";

import { useEffect, useState } from "react";
import type { KnowledgeItem } from "@/lib/types";

export function KnowledgeClient() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/knowledge-items", { cache: "no-store" });
      const payload = (await response.json()) as { items: KnowledgeItem[] };
      setItems(payload.items);
    }

    void load();
  }, []);

  return (
    <section className="admin-card">
      <table className="table">
        <thead>
          <tr>
            <th>标题</th>
            <th>分类</th>
            <th>来源</th>
            <th>可见性</th>
            <th>AI 可用</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.category}</td>
              <td>{item.sourceType}</td>
              <td>
                <span className={item.visibility === "public" ? "chip" : "chip coral"}>{item.visibility}</span>
              </td>
              <td>
                <span className={item.isAiUsable ? "chip cyan" : "chip coral"}>{item.isAiUsable ? "可用于AI回答" : "不可引用"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

