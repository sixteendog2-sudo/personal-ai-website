"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { FileText, Upload } from "lucide-react";

type AdminStudyRow = {
  id: string; title: string; summary: string | null;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private" | "unlisted";
  metadata: Record<string, unknown>;
  updatedAt: string;
};

export function StudyDocumentClient() {
  const [items, setItems] = useState<AdminStudyRow[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/content-items?type=study")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load study records");
        const payload = await response.json() as { items: AdminStudyRow[] };
        setItems(payload.items);
      })
      .catch(() => setMessage("学习记录加载失败，请刷新页面。"))
      .finally(() => setLoading(false));
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("文档不能超过 5 MB。");
      event.target.value = "";
      return;
    }
    setBody(await file.text());
    if (!title) setTitle(file.name.replace(/\.(md|markdown|txt)$/i, ""));
    setMessage("文档已读取，可以继续编辑后保存。");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/admin/study-documents", { method: "POST", body: new FormData(form) });
      const payload = await response.json() as { item?: AdminStudyRow; error?: string };
      if (!response.ok || !payload.item) throw new Error(payload.error || "保存失败");
      setItems((current) => [payload.item as AdminStudyRow, ...current]);
      setTitle(""); setBody(""); form.reset();
      setMessage("学习记录已保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">学习档案</div>
          <h1>记录学习过程，导入 Markdown 文档</h1>
          <p className="prose">可以直接编辑或粘贴飞书内容，也可以上传 .md、.markdown、.txt 文件。</p>
        </div>
      </header>
      <section className="admin-card" style={{ marginBottom: 20 }}>
        <form onSubmit={submit}>
          <div className="document-upload">
            <Upload size={22} />
            <div><strong>导入学习文档</strong><p>最大 5 MB，导入后可继续编辑。</p></div>
            <input aria-label="上传学习文档" name="file" type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" onChange={handleFile} />
          </div>
          <div className="form-grid" style={{ marginTop: 18 }}>
            <div className="field"><label htmlFor="study-title">标题</label><input id="study-title" name="title" required maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)} /></div>
            <div className="field"><label htmlFor="study-type">类型</label><select id="study-type" name="studyType" defaultValue="document"><option value="document">学习文档</option><option value="course">课程</option><option value="research_interest">研究兴趣</option><option value="certificate">证书</option><option value="project">项目学习</option></select></div>
            <div className="field"><label htmlFor="study-period">学习周期</label><input id="study-period" name="period" placeholder="2026.06 - 至今" /></div>
            <div className="field"><label htmlFor="study-institution">机构或来源</label><input id="study-institution" name="institution" placeholder="学校、课程平台或自学" /></div>
            <div className="field"><label htmlFor="study-tags">标签</label><input id="study-tags" name="tags" placeholder="AI, 阅读, 笔记" /></div>
            <div className="field"><label htmlFor="study-status">状态</label><select id="study-status" name="status" defaultValue="draft"><option value="draft">草稿</option><option value="published">发布</option></select></div>
            <div className="field"><label htmlFor="study-visibility">可见范围</label><select id="study-visibility" name="visibility" defaultValue="private"><option value="private">私密</option><option value="unlisted">不公开列出</option><option value="public">公开</option></select></div>
          </div>
          <div className="field" style={{ marginTop: 14 }}><label htmlFor="study-summary">摘要</label><textarea id="study-summary" name="summary" maxLength={1000} style={{ minHeight: 88 }} /></div>
          <div className="field" style={{ marginTop: 14 }}><label htmlFor="study-body">正文（支持 Markdown）</label><textarea id="study-body" name="body" required maxLength={100000} value={body} onChange={(event) => setBody(event.target.value)} style={{ minHeight: 320 }} /></div>
          <label className="check-field"><input name="isAiUsable" type="checkbox" value="true" />允许 AI 在回答中引用这条学习记录</label>
          <div className="admin-form-actions">
            <button className="button" type="submit" disabled={submitting}><FileText size={16} />{submitting ? "保存中…" : "保存学习记录"}</button>
            <span className="form-message" role="status">{message}</span>
          </div>
        </form>
      </section>
      <section className="admin-card">
        <h2>学习记录</h2>
        {loading ? <p className="prose">正在加载…</p> : (
          <div className="table-scroll"><table className="table">
            <thead><tr><th>标题</th><th>类型</th><th>状态</th><th>可见范围</th><th>更新时间</th></tr></thead>
            <tbody>{items.map((item) => <tr key={item.id}><td>{item.title}</td><td>{String(item.metadata.studyType || "document")}</td><td><span className="chip">{item.status}</span></td><td>{item.visibility}</td><td>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
