"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";

type KnowledgeRow = {
  id: string; title: string; category: string; body: string; tags: string[]; sourceType: string;
  sourceId?: string | null; visibility: "public" | "private" | "unlisted";
  status: "draft" | "published" | "archived"; isAiUsable: boolean; updatedAt: string;
};

type KnowledgeForm = {
  title: string; category: string; body: string; tags: string;
  visibility: "public" | "private" | "unlisted";
  status: "draft" | "published" | "archived";
  isAiUsable: boolean;
};

const blank: KnowledgeForm = { title: "", category: "", body: "", tags: "", visibility: "private", status: "draft", isAiUsable: false };

export function KnowledgeClient() {
  const [items, setItems] = useState<KnowledgeRow[]>([]);
  const [editing, setEditing] = useState<KnowledgeRow | null>(null);
  const [form, setForm] = useState<KnowledgeForm>({ ...blank });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/knowledge-items", { cache: "no-store" });
    const payload = await response.json() as { items?: KnowledgeRow[] };
    setItems(payload.items ?? []); setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  function beginEdit(item: KnowledgeRow) {
    setEditing(item);
    setForm({ title: item.title, category: item.category, body: item.body, tags: item.tags.join(", "), visibility: item.visibility, status: item.status, isAiUsable: item.isAiUsable });
    setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() { setEditing(null); setForm({ ...blank }); setMessage(""); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const payload = {
      title: form.title, category: form.category, body: form.body,
      tags: form.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      sourceType: editing?.sourceType ?? "manual", sourceId: editing?.sourceId ?? null,
      visibility: form.visibility, status: form.status, isAiUsable: form.isAiUsable
    };
    const response = await fetch(editing ? `/api/admin/knowledge-items/${editing.id}` : "/api/admin/knowledge-items", {
      method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    if (!response.ok) { setMessage("保存失败，请检查必填项。"); return; }
    setMessage(editing ? "知识已更新并重新分块。" : "知识已创建并完成分块。");
    setEditing(null); setForm({ ...blank }); await load();
  }

  async function archive(item: KnowledgeRow) {
    if (!window.confirm(`确定停用“${item.title}”吗？停用后 AI 不再引用。`)) return;
    const response = await fetch(`/api/admin/knowledge-items/${item.id}`, { method: "DELETE" });
    setMessage(response.ok ? "知识已停用。" : "停用失败。"); await load();
  }

  return (
    <>
      <section className="admin-card" style={{ marginBottom: 20 }}>
        <div className="admin-editor-heading"><div><h2>{editing ? "编辑知识" : "新建知识"}</h2><p>可维护手工知识、内容同步知识，以及由访客问题沉淀的知识。</p></div>{editing ? <button className="button ghost" type="button" onClick={reset}><X size={16} />取消编辑</button> : <button className="button secondary" type="button" onClick={reset}><Plus size={16} />新建知识</button>}</div>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="field"><label>标题</label><input required maxLength={240} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
            <div className="field"><label>分类</label><input required maxLength={100} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
            <div className="field"><label>状态</label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as KnowledgeForm["status"] })}><option value="draft">草稿</option><option value="published">发布</option><option value="archived">归档</option></select></div>
            <div className="field"><label>可见范围</label><select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value as KnowledgeForm["visibility"] })}><option value="private">私密</option><option value="unlisted">不公开列出</option><option value="public">公开</option></select></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label>标签</label><input placeholder="使用逗号分隔" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></div>
          </div>
          <div className="field" style={{ marginTop: 14 }}><label>知识正文</label><textarea required maxLength={200000} style={{ minHeight: 220 }} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></div>
          <label className="check-field"><input type="checkbox" checked={form.isAiUsable} onChange={(event) => setForm({ ...form, isAiUsable: event.target.checked })} />允许 AI 检索和引用</label>
          <p className="privacy-note">访客 AI 只会读取“已发布 + 公开 + 允许 AI 引用”的知识正文。图片和媒体表不会进入模型上下文。</p>
          <div className="admin-form-actions"><button className="button" type="submit"><Save size={16} />{editing ? "更新知识" : "保存知识"}</button><span className="form-message" role="status">{message}</span></div>
        </form>
      </section>
      <section className="admin-card">
        <h2>知识条目</h2>
        {loading ? <p className="prose">正在加载…</p> : <div className="table-scroll"><table className="table"><thead><tr><th>标题</th><th>分类</th><th>来源</th><th>状态</th><th>可见性</th><th>AI</th><th>操作</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.title}</td><td>{item.category}</td><td>{item.sourceType}</td><td>{item.status}</td><td><span className={item.visibility === "public" ? "chip" : "chip coral"}>{item.visibility}</span></td><td><span className={item.isAiUsable ? "chip cyan" : "chip coral"}>{item.isAiUsable ? "可引用" : "不引用"}</span></td><td><div className="admin-row-actions"><button className="button secondary" type="button" onClick={() => beginEdit(item)}><Pencil size={14} />编辑</button><button className="button coral" type="button" disabled={item.status === "archived"} onClick={() => void archive(item)}><Trash2 size={14} />停用</button></div></td></tr>)}</tbody></table></div>}
      </section>
    </>
  );
}
