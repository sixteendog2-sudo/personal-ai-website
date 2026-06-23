"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { KeyRound, Save } from "lucide-react";

type ModelForm = { provider: string; baseUrl: string; model: string; apiKey: string; temperature: string; maxTokens: string };
type ModelRow = { id: string; provider: string; model: string; baseUrl: string; temperatureMilli: number; maxTokens: number; isActive: boolean; updatedAt: string; hasApiKey: boolean; apiKeyLastFour: string | null };

const presets: Record<string, Pick<ModelForm, "baseUrl" | "model">> = {
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
  deepseek: { baseUrl: "https://api.deepseek.com", model: "deepseek-chat" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4.1-mini" },
  qwen: { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
  kimi: { baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
  glm: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" }
};

const defaults: ModelForm = { provider: "deepseek", ...presets.deepseek, apiKey: "", temperature: "0.7", maxTokens: "1200" };

export function ModelSettingsClient() {
  const [form, setForm] = useState(defaults);
  const [items, setItems] = useState<ModelRow[]>([]);
  const [message, setMessage] = useState("");
  const active = items.find((item) => item.isActive);

  async function load() {
    const response = await fetch("/api/admin/model-settings", { cache: "no-store" });
    const payload = await response.json() as { items?: ModelRow[] };
    const rows = payload.items ?? [];
    setItems(rows);
    const current = rows.find((item) => item.isActive) ?? rows[0];
    if (current) setForm({ provider: current.provider, baseUrl: current.baseUrl, model: current.model, apiKey: "", temperature: String(current.temperatureMilli / 1000), maxTokens: String(current.maxTokens) });
  }

  useEffect(() => { void load(); }, []);

  function selectProvider(provider: string) {
    const preset = presets[provider];
    setForm((current) => ({ ...current, provider, ...(preset ?? {}) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const response = await fetch("/api/admin/model-settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: form.provider, baseUrl: form.baseUrl, model: form.model,
        apiKey: form.apiKey || undefined, keepExistingApiKey: !form.apiKey && active?.hasApiKey === true,
        temperature: Number(form.temperature), maxTokens: Number(form.maxTokens)
      })
    });
    setMessage(response.ok ? "模型与密钥已加密保存并激活。" : "保存失败，请检查 HTTPS 地址、密钥和数值范围。");
    if (response.ok) { setForm((current) => ({ ...current, apiKey: "" })); await load(); }
  }

  return <>
    <header className="admin-header"><div><div className="eyebrow">模型设置</div><h1>连接 OpenAI 兼容的大模型</h1><p className="prose">密钥只在服务端加密保存，页面与接口永远不返回明文。</p></div></header>
    <section className="admin-card"><form onSubmit={submit}>
      <div className="form-grid">
        <div className="field"><label>模型供应商</label><select value={form.provider} onChange={(event) => selectProvider(event.target.value)}>{Object.keys(presets).map((provider) => <option key={provider} value={provider}>{provider}</option>)}</select></div>
        <div className="field"><label>Base URL</label><input type="url" required value={form.baseUrl} onChange={(event) => setForm({ ...form, baseUrl: event.target.value })} /></div>
        <div className="field"><label>聊天模型</label><input required value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} /></div>
        <div className="field"><label><KeyRound size={15} /> API Key</label><input type="password" autoComplete="new-password" placeholder={active?.hasApiKey ? `已保存 ····${active.apiKeyLastFour ?? ""}（留空继续使用）` : "粘贴供应商 API Key"} value={form.apiKey} onChange={(event) => setForm({ ...form, apiKey: event.target.value })} /></div>
        <div className="field"><label>Temperature（0–2）</label><input type="number" min="0" max="2" step="0.1" value={form.temperature} onChange={(event) => setForm({ ...form, temperature: event.target.value })} /></div>
        <div className="field"><label>最大 Tokens</label><input type="number" min="64" max="32000" value={form.maxTokens} onChange={(event) => setForm({ ...form, maxTokens: event.target.value })} /></div>
      </div>
      <p className="privacy-note">支持 OpenAI、DeepSeek、OpenRouter、通义千问、Kimi、智谱等 OpenAI Chat Completions 兼容接口；也可以手动修改 Base URL 与模型名。</p>
      <div className="admin-form-actions"><button className="button" type="submit"><Save size={16} />保存并激活</button><span className="form-message" role="status">{message}</span></div>
    </form></section>
    <section className="admin-card" style={{ marginTop: 20 }}><h2>设置历史</h2><div className="table-scroll"><table className="table"><thead><tr><th>供应商</th><th>模型</th><th>密钥</th><th>Temperature</th><th>状态</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.provider}</td><td>{item.model}</td><td>{item.hasApiKey ? `····${item.apiKeyLastFour ?? ""}` : "未保存"}</td><td>{item.temperatureMilli / 1000}</td><td><span className={item.isActive ? "chip lime" : "chip"}>{item.isActive ? "当前" : "历史"}</span></td></tr>)}</tbody></table></div></section>
  </>;
}
