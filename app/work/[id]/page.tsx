import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, BriefcaseBusiness } from "lucide-react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SiteNav } from "@/components/SiteNav";
import { getWorkProject } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getWorkProject(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="page">
      <SiteNav />
      <section className="container page-title">
        <div className="eyebrow">项目详情</div>
        <h1>{project.title}</h1>
        <p>{project.summary}</p>
      </section>
      <section className="container section detail-layout">
        <div className={`photo detail-photo ${project.imageTone}`} />
        <aside className="card">
          <div className="card-body">
            <BriefcaseBusiness color="#00a88a" size={28} />
            <h2>我的角色</h2>
            <p className="prose">{project.role}</p>
            <h2>成果</h2>
            <p className="prose">{project.result}</p>
            <div className="chips">
              {project.techStack.map((tech) => (
                <span className="chip cyan" key={tech}>
                  {tech}
                </span>
              ))}
            </div>
            <Link className="button" href={`/chat?topic=work`} style={{ marginTop: 18 }}>
              <Bot size={16} />
              围绕项目提问
            </Link>
          </div>
        </aside>
      </section>
      <section className="container section">
        <div className="card">
          <div className="card-body">
            <h2>项目说明</h2>
            <MarkdownContent content={project.body} />
          </div>
        </div>
      </section>
    </main>
  );
}
