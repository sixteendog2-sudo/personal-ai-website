import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, CalendarDays, MapPin } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SiteNav } from "@/components/SiteNav";
import { getLifeRecord, listLifeRecordsPage } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function LifeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getLifeRecord(id);

  if (!record) {
    notFound();
  }

  const related = (await listLifeRecordsPage({ limit: 3 })).items.filter((item) => item.id !== record.id).slice(0, 2);

  return (
    <main className="page">
      <SiteNav />
      <section className="container page-title">
        <div className="eyebrow">生活记录详情</div>
        <h1>{record.title}</h1>
        <p>{record.excerpt}</p>
      </section>
      <section className="container section detail-layout">
        {record.imageUrl ? <img className="photo detail-photo" src={record.imageUrl} alt={record.imageAlt || record.title} /> : <div className={`photo detail-photo ${record.imageTone}`} />}
        <aside className="card">
          <div className="card-body">
            <div className="chips">
              <span className="chip">
                <CalendarDays size={14} />
                {record.occurredAt}
              </span>
              <span className="chip cyan">
                <MapPin size={14} />
                {record.location}
              </span>
            </div>
            <div className="chips">
              {record.tags.map((tag) => (
                <span className="chip lime" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 20 }}><MarkdownContent content={record.body} /></div>
            <Link className="button" href={`/chat?topic=life&recordId=${record.id}`} style={{ marginTop: 18 }}>
              <Bot size={16} />
              围绕这条记录提问
            </Link>
          </div>
        </aside>
      </section>
      <section className="container section">
        <h2>相关记忆</h2>
        <div className="grid two">
          {related.map((item) => (
            <Link className="card" href={`/life/${item.id}`} key={item.id}>
              <div className="card-body">
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
