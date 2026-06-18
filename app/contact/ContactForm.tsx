"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/visitor/contact-intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    if (response.ok) {
      event.currentTarget.reset();
      setStatus("sent");
    } else {
      setStatus("error");
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <div className="field"><label htmlFor="contact-name">称呼</label><input id="contact-name" name="name" maxLength={120} required /></div>
      <div className="field"><label htmlFor="contact-method">联系方式</label><input id="contact-method" name="contact" maxLength={255} required placeholder="邮箱、微信或手机号" /></div>
      <div className="field"><label htmlFor="contact-intent">联系目的</label><select id="contact-intent" name="intent" defaultValue="collaboration"><option value="admission">升学交流</option><option value="social">社交认识</option><option value="career">求职机会</option><option value="collaboration">项目合作</option><option value="other">其他</option></select></div>
      <div className="field" style={{ gridColumn: "1 / -1" }}><label htmlFor="contact-message">留言</label><textarea id="contact-message" name="message" minLength={5} maxLength={2000} required /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button className="button" type="submit" disabled={status === "sending"}><Send size={16} />{status === "sending" ? "提交中" : "提交联系意向"}</button>
        {status === "sent" ? <span className="chip lime">已收到，我会尽快查看</span> : null}
        {status === "error" ? <span className="chip coral">提交失败，请稍后重试</span> : null}
      </div>
    </form>
  );
}
