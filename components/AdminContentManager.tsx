"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FileText, ImagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";

type ContentType = "life" | "study" | "work";
type Status = "draft" | "published" | "archived";
type Visibility = "private" | "unlisted" | "public";
type AdminMedia = { id: string; altText: string | null; sortOrder: number; thumbnail: { id: string } | null };
type AdminContent = {
  id: string;
  type: ContentType;
  title: string;
  summary: string | null;
  body: string;
  status: Status;
  visibility: Visibility;
  happenedAt: string | null;
  metadata: Record<string, unknown>;
  updatedAt: string;
  media?: AdminMedia[];
};

type FormState = {
  title: string; summary: string; body: string; status: Status; visibility: Visibility;
  happenedAt: string; tags: string; isAiUsable: boolean; location: string; mood: string;
  studyType: string; period: string; institution: string; role: string; techStack: string; result: string;
};

const labels = {
  life: { eyebrow: "生活记录", title: "维护生活文本与照片", add: "新建生活记录" },
  study: { eyebrow: "学习档案", title: "维护学习过程与文档", add: "新建学习记录" },
  work: { eyebrow: "工作项目", title: "维护项目经历与成果", add: "新建工作项目" }
} as const;

function emptyForm(type: ContentType): FormState {
  return {
    title: "", summary: "", body: "", status: "draft", visibility: "private", happenedAt: "",
    tags: "", isAiUsable: false, location: "", mood: "", studyType: type === "study" ? "document" : "",
    period: "", institution: "", role: "", techStack: "", result: ""
  };
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join(", ") : "";
}

function formFromItem(item: AdminContent): FormState {
  const metadata = item.metadata;
  return {
    title: item.title, summary: item.summary ?? "", body: item.body, status: item.status,
    visibility: item.visibility, happenedAt: item.happenedAt?.slice(0, 10) ?? "", tags: strings(metadata.tags),
    isAiUsable: metadata.isAiUsable === true, location: String(metadata.location ?? ""), mood: String(metadata.mood ?? ""),
    studyType: String(metadata.studyType ?? "document"), period: String(metadata.period ?? ""),
    institution: String(metadata.institution ?? ""), role: String(metadata.role ?? ""),
    techStack: strings(metadata.techStack), result: String(metadata.result ?? "")
  };
}

function splitTags(value: string) {
  return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean).slice(0, 20);
}

export function AdminContentManager({ type }: { type: ContentType }) {
  const [items, setItems] = useState<AdminContent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(type));
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content-items?type=${type}`, { cache: "no-store" });
      const payload = await response.json() as { items?: AdminContent[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "加载失败");
      setItems(payload.items ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "内容加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [type]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startNew() {
    setEditingId(null); setForm(emptyForm(type)); setImageFiles([]); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(item: AdminContent) {
    setEditingId(item.id); setForm(formFromItem(item)); setImageFiles([]); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function readDocument(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setMessage("文档不能超过 10 MB。"); return; }
    setMessage("正在解析文档…");
    const upload = new FormData(); upload.set("file", file);
    try {
      const response = await fetch("/api/admin/study-documents/parse", { method: "POST", body: upload });
      const payload = await response.json() as { body?: string; warnings?: string[]; error?: string };
      if (!response.ok || !payload.body) throw new Error(payload.error || "文档解析失败");
      setForm((current) => ({
        ...current,
        body: payload.body!,
        title: current.title || file.name.replace(/\.(md|markdown|txt|docx)$/i, "")
      }));
      setMessage(payload.warnings?.length ? "文档已解析，部分复杂格式已转换为纯文本，请确认正文。" : "文档已解析到知识库正文，请确认后保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "文档解析失败");
    }
  }

  function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const existingCount = editingId ? (items.find((item) => item.id === editingId)?.media?.length ?? 0) : 0;
    const available = Math.max(0, 12 - existingCount);
    const selected = files.slice(0, available);
    setImageFiles(selected);
    if (available === 0) setMessage("这条内容已有 12 张图片，请先移除后再添加。");
    else if (files.length > available) setMessage(`每条内容最多 12 张，已选择前 ${available} 张。`);
    else setMessage(selected.length ? `已选择 ${selected.length} 张图片。` : "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const metadata: Record<string, unknown> = { tags: splitTags(form.tags), isAiUsable: form.isAiUsable };
    if (type === "life") Object.assign(metadata, { location: form.location, mood: form.mood });
    if (type === "study") Object.assign(metadata, { studyType: form.studyType, period: form.period, institution: form.institution });
    if (type === "work") Object.assign(metadata, { role: form.role, techStack: splitTags(form.techStack), result: form.result, period: form.period });
    const payload = {
      type, title: form.title, summary: form.summary || null, body: form.body,
      status: form.status, visibility: form.visibility,
      happenedAt: form.happenedAt ? new Date(`${form.happenedAt}T12:00:00+08:00`).toISOString() : null,
      metadata
    };
    try {
      const response = await fetch(editingId ? `/api/admin/content-items/${editingId}` : "/api/admin/content-items", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const saved = await response.json() as { item?: AdminContent; error?: string };
      if (!response.ok || !saved.item) throw new Error(saved.error || "保存失败");
      const existingCount = editingId ? (items.find((item) => item.id === editingId)?.media?.length ?? 0) : 0;
      for (const [index, imageFile] of imageFiles.entries()) {
        const mediaForm = new FormData(); mediaForm.set("file", imageFile); mediaForm.set("altText", `${form.title} - ${existingCount + index + 1}`);
        const mediaResponse = await fetch("/api/admin/media-assets", { method: "POST", body: mediaForm });
        const mediaPayload = await mediaResponse.json() as { item?: { original: { id: string } }; error?: string };
        if (!mediaResponse.ok || !mediaPayload.item) throw new Error(mediaPayload.error || "图片上传失败");
        const linkResponse = await fetch(`/api/admin/content-items/${saved.item.id}/media`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId: mediaPayload.item.original.id, sortOrder: existingCount + index, replace: false })
        });
        if (!linkResponse.ok) throw new Error("图片已上传，但绑定内容失败");
      }
      setMessage(`${editingId ? "内容已更新" : "内容已创建"}，${imageFiles.length ? `${imageFiles.length} 张图片已保存，` : ""}文本知识已同步。`);
      setEditingId(null); setForm(emptyForm(type)); setImageFiles([]); await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally { setSaving(false); }
  }

  async function remove(item: AdminContent) {
    if (!window.confirm(`确定永久删除“${item.title}”吗？关联的知识条目会同步删除，媒体文件保留在媒体库。`)) return;
    const response = await fetch(`/api/admin/content-items/${item.id}`, { method: "DELETE" });
    if (!response.ok) { setMessage("删除失败，请稍后重试。"); return; }
    if (editingId === item.id) startNew();
    setMessage("内容及关联文本知识已删除。"); await load();
  }

  async function removeImage(mediaId: string) {
    if (!editingId || !window.confirm("确定移除这张图片吗？未被其他内容使用的原图和缩略图会一并删除。")) return;
    const response = await fetch(`/api/admin/content-items/${editingId}/media`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaId })
    });
    if (!response.ok) { setMessage("图片移除失败。"); return; }
    setMessage("图片已移除。"); await load();
  }

  const config = labels[type];
  return (
    <>
      <header className="admin-header">
        <div><div className="eyebrow">{config.eyebrow}</div><h1>{config.title}</h1></div>
        <button className="button secondary" type="button" onClick={startNew}><Plus size={16} />{config.add}</button>
      </header>
      <section className="admin-card admin-editor-card">
        <div className="admin-editor-heading">
          <div><h2>{editingId ? "编辑记录" : config.add}</h2><p>图片与文本分开存储；AI 只读取下方授权的文本字段。</p></div>
          {editingId ? <button className="button ghost" type="button" onClick={startNew}><X size={16} />取消编辑</button> : null}
        </div>
        <form onSubmit={submit}>
          {type === "study" ? <div className="document-upload"><FileText size={22} /><div><strong>导入知识库正文</strong><p>支持 Markdown、TXT、Word (.docx)，最大 10 MB；解析后可继续编辑。</p></div><input aria-label="导入学习文档" type="file" accept=".md,.markdown,.txt,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={readDocument} /></div> : null}
          <div className="document-upload" style={{ marginTop: type === "study" ? 12 : 0 }}><ImagePlus size={22} /><div><strong>{editingId ? "继续添加图片" : "上传多张图片"}</strong><p>可一次选择多张 JPEG、PNG、WebP；每张最大 15 MB，每条内容最多 12 张。</p></div><input aria-label="上传多张图片" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectImages} /></div>
          {imageFiles.length ? <div className="pending-media-list">{imageFiles.map((file, index) => <span className="chip cyan" key={`${file.name}-${index}`}>{index + 1}. {file.name}</span>)}</div> : null}
          {editingId && items.find((item) => item.id === editingId)?.media?.length ? <div className="admin-media-grid">{items.find((item) => item.id === editingId)!.media!.map((media, index) => <figure key={media.id}><img src={`/api/media/${media.thumbnail?.id ?? media.id}`} alt={media.altText || `${form.title} ${index + 1}`} /><figcaption><span>{index + 1}</span><button className="button ghost" type="button" onClick={() => void removeImage(media.id)}>移除</button></figcaption></figure>)}</div> : null}
          <div className="form-grid" style={{ marginTop: 18 }}>
            <div className="field"><label htmlFor={`${type}-title`}>标题</label><input id={`${type}-title`} required maxLength={240} value={form.title} onChange={(event) => update("title", event.target.value)} /></div>
            <div className="field"><label htmlFor={`${type}-status`}>状态</label><select id={`${type}-status`} value={form.status} onChange={(event) => update("status", event.target.value as Status)}><option value="draft">草稿</option><option value="published">发布</option><option value="archived">归档</option></select></div>
            <div className="field"><label htmlFor={`${type}-visibility`}>可见范围</label><select id={`${type}-visibility`} value={form.visibility} onChange={(event) => update("visibility", event.target.value as Visibility)}><option value="private">私密</option><option value="unlisted">不公开列出</option><option value="public">公开</option></select></div>
            {type === "life" ? <><div className="field"><label>发生日期</label><input type="date" value={form.happenedAt} onChange={(event) => update("happenedAt", event.target.value)} /></div><div className="field"><label>地点</label><input value={form.location} onChange={(event) => update("location", event.target.value)} /></div><div className="field"><label>心情</label><input value={form.mood} onChange={(event) => update("mood", event.target.value)} /></div></> : null}
            {type === "study" ? <><div className="field"><label>类型</label><select value={form.studyType} onChange={(event) => update("studyType", event.target.value)}><option value="document">学习文档</option><option value="course">课程</option><option value="research_interest">研究兴趣</option><option value="certificate">证书</option><option value="project">项目学习</option></select></div><div className="field"><label>学习周期</label><input value={form.period} onChange={(event) => update("period", event.target.value)} /></div><div className="field"><label>机构或来源</label><input value={form.institution} onChange={(event) => update("institution", event.target.value)} /></div></> : null}
            {type === "work" ? <><div className="field"><label>个人角色</label><input value={form.role} onChange={(event) => update("role", event.target.value)} /></div><div className="field"><label>项目周期</label><input value={form.period} onChange={(event) => update("period", event.target.value)} /></div><div className="field"><label>技术栈</label><input placeholder="Next.js, PostgreSQL" value={form.techStack} onChange={(event) => update("techStack", event.target.value)} /></div><div className="field"><label>项目成果</label><input value={form.result} onChange={(event) => update("result", event.target.value)} /></div></> : null}
            <div className="field"><label>标签</label><input placeholder="使用逗号分隔" value={form.tags} onChange={(event) => update("tags", event.target.value)} /></div>
          </div>
          <div className="field" style={{ marginTop: 14 }}><label>摘要</label><textarea maxLength={1000} style={{ minHeight: 88 }} value={form.summary} onChange={(event) => update("summary", event.target.value)} /></div>
          <div className="field" style={{ marginTop: 14 }}><label>正文（支持 Markdown）</label><textarea required maxLength={100000} style={{ minHeight: 260 }} value={form.body} onChange={(event) => update("body", event.target.value)} /></div>
          <label className="check-field"><input type="checkbox" checked={form.isAiUsable} onChange={(event) => update("isAiUsable", event.target.checked)} />允许 AI 引用这条记录的文本（不包含图片）</label>
          <p className="privacy-note">只有“已发布 + 公开 + 允许 AI 引用”同时满足时，文本才会进入访客知识检索。私密图片和媒体元数据不会发送给模型。</p>
          <div className="admin-form-actions"><button className="button" type="submit" disabled={saving}><Save size={16} />{saving ? "保存中…" : editingId ? "更新记录" : "保存记录"}</button><span className="form-message" role="status">{message}</span></div>
        </form>
      </section>
      <section className="admin-card" style={{ marginTop: 20 }}>
        <h2>现有记录</h2>
        {loading ? <p className="prose">正在加载…</p> : items.length === 0 ? <p className="prose">还没有记录。</p> : <div className="admin-content-list">{items.map((item) => {
          const thumbnailId = item.media?.[0]?.thumbnail?.id;
          return <article className="admin-content-row" key={item.id}>
            <div className="admin-thumb-wrap">{thumbnailId ? <img className="admin-content-thumb" src={`/api/media/${thumbnailId}`} alt={item.media?.[0]?.altText || item.title} /> : <div className="admin-content-thumb empty">无图片</div>}{item.media && item.media.length > 1 ? <span className="media-count">{item.media.length} 张</span> : null}</div>
            <div className="admin-content-copy"><h3>{item.title}</h3><p>{item.summary || "暂无摘要"}</p><div className="chips"><span className="chip">{item.status}</span><span className={item.visibility === "public" ? "chip cyan" : "chip coral"}>{item.visibility}</span><span className={item.metadata.isAiUsable === true ? "chip lime" : "chip coral"}>{item.metadata.isAiUsable === true ? "允许 AI 文本引用" : "不供 AI 使用"}</span></div></div>
            <div className="admin-row-actions"><button className="button secondary" type="button" onClick={() => startEdit(item)}><Pencil size={15} />编辑</button><button className="button coral" type="button" onClick={() => void remove(item)}><Trash2 size={15} />删除</button></div>
          </article>;
        })}</div>}
      </section>
    </>
  );
}
