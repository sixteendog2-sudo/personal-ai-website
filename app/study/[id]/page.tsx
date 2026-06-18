import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, Building2, CalendarDays, GraduationCap } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SiteNav } from "@/components/SiteNav";
import { getStudyItem } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getStudyItem(id);
  if (!item) notFound();

  return (
    <main className="page">
      <SiteNav />
      <section className="container page-title">
        <div className="eyebrow">学习记录详情</div>
        <h1>{item.title}</h1>
        <p>{item.summary}</p>
      </section>
      <section className="container section detail-layout">
        <article className="card">
          <div className="card-body">
            <MarkdownContent content={item.body} />
          </div>
        </article>
        <aside className="card">
          <div className="card-body">
            <GraduationCap color="#00a88a" size={28} />
            <div className="chips">
              <span className="chip cyan">{item.type}</span>
              {item.period && <span className="chip"><CalendarDays size={14} />{item.period}</span>}
              {item.institution && <span className="chip lime"><Building2 size={14} />{item.institution}</span>}
            </div>
            <div className="chips">
              {item.tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
            </div>
            <Link className="button" href={`/chat?topic=study&recordId=${item.id}`} style={{ marginTop: 18 }}>
              <Bot size={16} />
              围绕这条记录提问
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
