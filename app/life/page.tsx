import Link from "next/link";
import { Bot } from "lucide-react";
import { LifeRecordCard } from "@/components/Cards";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteNav } from "@/components/SiteNav";
import { lifeRecords } from "@/lib/mock-data";

export default function LifePage() {
  const records = lifeRecords.filter((item) => item.visibility === "public" && item.status === "published");

  return (
    <main className="page">
      <SiteNav />
      <section className="container page-title">
        <div className="eyebrow">生活记录</div>
        <h1>像刷信息流一样，看见一个更完整的人。</h1>
        <p>照片、短文字、时间地点和标签共同构成生活记录。公开且允许 AI 引用的内容，会成为个人知识库的一部分。</p>
      </section>
      <section className="container section">
        <SectionHeading
          title="最近记录"
          description="这部分更接近朋友圈或小红书的舒适浏览感，但底层连接个人知识库。"
          action={
            <Link className="button secondary" href="/chat?topic=life">
              <Bot size={16} />
              问问虚拟的我
            </Link>
          }
        />
        <div className="chips" style={{ marginBottom: 18 }}>
          <span className="chip">全部</span>
          <span className="chip cyan">旅行</span>
          <span className="chip coral">日常</span>
          <span className="chip lime">成长</span>
          <span className="chip">灵感</span>
        </div>
        <div className="feed-grid">
          {records.map((record, index) => (
            <LifeRecordCard key={record.id} record={record} tall={index % 2 === 1} />
          ))}
        </div>
      </section>
    </main>
  );
}

