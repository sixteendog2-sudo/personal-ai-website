"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";

type ProfileForm = {
  nickname: string; realName: string; headline: string; bio: string; city: string; tags: string;
  email: string; github: string; wechat: string; visibility: "public" | "private" | "unlisted"; isAiUsable: boolean;
};

const empty: ProfileForm = { nickname: "", realName: "", headline: "", bio: "", city: "", tags: "", email: "", github: "", wechat: "", visibility: "public", isAiUsable: true };

export function ProfileClient() {
  const [form, setForm] = useState<ProfileForm>(empty);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/profile", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { item?: { nickname: string; realName?: string | null; headline: string; bio: string; city: string; tags: string[]; contact: { email?: string; github?: string; wechat?: string }; visibility: ProfileForm["visibility"]; isAiUsable: boolean } };
      if (!payload.item) return;
      setForm({ nickname: payload.item.nickname, realName: payload.item.realName ?? "", headline: payload.item.headline, bio: payload.item.bio, city: payload.item.city, tags: payload.item.tags.join(", "), email: payload.item.contact.email ?? "", github: payload.item.contact.github ?? "", wechat: payload.item.contact.wechat ?? "", visibility: payload.item.visibility, isAiUsable: payload.item.isAiUsable });
    }).catch(() => setMessage("个人资料加载失败。"));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const response = await fetch("/api/admin/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      nickname: form.nickname, realName: form.realName || null, headline: form.headline, bio: form.bio, city: form.city,
      tags: form.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      contact: { ...(form.email ? { email: form.email } : {}), ...(form.github ? { github: form.github } : {}), ...(form.wechat ? { wechat: form.wechat } : {}) },
      visibility: form.visibility, isAiUsable: form.isAiUsable
    }) });
    setMessage(response.ok ? "个人资料已保存，公开关于页面会读取最新数据。" : "保存失败，请检查邮箱和链接格式。"); setSaving(false);
  }

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  return <><header className="admin-header"><div><div className="eyebrow">个人资料</div><h1>维护公开介绍和联系信息</h1></div></header><section className="admin-card"><form onSubmit={submit}><div className="form-grid">
    <div className="field"><label>昵称</label><input required value={form.nickname} onChange={(event) => set("nickname", event.target.value)} /></div>
    <div className="field"><label>真实姓名</label><input value={form.realName} onChange={(event) => set("realName", event.target.value)} /></div>
    <div className="field"><label>城市</label><input value={form.city} onChange={(event) => set("city", event.target.value)} /></div>
    <div className="field"><label>一句话介绍</label><input maxLength={300} value={form.headline} onChange={(event) => set("headline", event.target.value)} /></div>
    <div className="field"><label>邮箱</label><input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} /></div>
    <div className="field"><label>GitHub 链接</label><input type="url" value={form.github} onChange={(event) => set("github", event.target.value)} /></div>
    <div className="field"><label>微信</label><input value={form.wechat} onChange={(event) => set("wechat", event.target.value)} /></div>
    <div className="field"><label>关键词</label><input value={form.tags} onChange={(event) => set("tags", event.target.value)} placeholder="使用逗号分隔" /></div>
    <div className="field"><label>可见范围</label><select value={form.visibility} onChange={(event) => set("visibility", event.target.value as ProfileForm["visibility"])}><option value="public">公开</option><option value="unlisted">不公开列出</option><option value="private">私密</option></select></div>
    <div className="field" style={{ gridColumn: "1 / -1" }}><label>个人简介</label><textarea value={form.bio} onChange={(event) => set("bio", event.target.value)} /></div>
  </div><label className="check-field"><input type="checkbox" checked={form.isAiUsable} onChange={(event) => set("isAiUsable", event.target.checked)} />允许在管理员侧保留为可用资料；访客 AI 当前只检索工作、生活、学习和已沉淀问题</label><div className="admin-form-actions"><button className="button" type="submit" disabled={saving}><Save size={16} />{saving ? "保存中…" : "保存个人资料"}</button><span className="form-message" role="status">{message}</span></div></form></section></>;
}
