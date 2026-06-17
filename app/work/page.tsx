import Link from "next/link";
import { Bot } from "lucide-react";
import { WorkProjectCard } from "@/components/Cards";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteNav } from "@/components/SiteNav";
import { workProjects } from "@/lib/mock-data";

export default function WorkPage() {
  return (
    <main className="page">
      <SiteNav />
      <section className="container page-title">
        <div className="eyebrow">工作项目</div>
        <h1>用项目说明能力，而不是只罗列技能。</h1>
        <p>项目详情会说明背景、角色、方法、技术栈和成果，适合求职、实习、合作场景。</p>
      </section>
      <section className="container section">
        <SectionHeading
          title="项目作品"
          description="项目记录也会同步到知识库，访客提问时可以被引用。"
          action={
            <Link className="button" href="/chat?topic=work">
              <Bot size={16} />
              问项目经历
            </Link>
          }
        />
        <div className="grid two">
          {workProjects.map((project) => (
            <WorkProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}

