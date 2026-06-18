import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { profile } from "@/lib/mock-data";
import { ContactForm } from "./ContactForm";

export default function ContactPage() {
  return (
    <main className="page">
      <SiteNav />
      <section className="container page-title">
        <div className="eyebrow">联系我</div>
        <h1>根据不同目的，选择更合适的联系入口。</h1>
        <p>联系意图会被沉淀到后台，帮助后续整理访客真正关心的问题。</p>
      </section>
      <section className="container section grid two">
        {[
          ["升学", "导师、同学、项目负责人与学习合作交流。"],
          ["社交", "朋友、兴趣圈层、生活记录相关交流。"],
          ["求职", "HR、面试官、合作方了解项目和能力。"],
          ["合作", "围绕 AI、知识库、个人网站继续合作。"]
        ].map(([title, text], index) => (
          <div className="card" key={title}>
            <div className="card-body">
              <span className={`chip ${index === 1 ? "coral" : index === 2 ? "cyan" : "lime"}`}>{title}</span>
              <h3 style={{ marginTop: 14 }}>{text}</h3>
              <p>Demo 阶段先展示联系入口，后续会接入表单和后台意图管理。</p>
            </div>
          </div>
        ))}
      </section>
      <section className="container section">
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-body"><h2>留下联系意向</h2><ContactForm /></div>
        </div>
        <div className="card">
          <div className="card-body">
            <Mail color="#00a88a" size={28} />
            <h2>公开联系方式</h2>
            <p className="prose">邮箱：{profile.contact.email}</p>
            <p className="prose">GitHub：{profile.contact.github}</p>
            <Link className="button" href="/chat?topic=social" style={{ marginTop: 18 }}>
              <MessageCircle size={16} />
              先问问虚拟的我
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
