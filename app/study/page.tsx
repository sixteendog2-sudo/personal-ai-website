import Link from "next/link";
import { Bot, GraduationCap } from "lucide-react";
import { StudyCard } from "@/components/Cards";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteNav } from "@/components/SiteNav";
import { studyItems } from "@/lib/mock-data";

export default function StudyPage() {
  return (
    <main className="page">
      <SiteNav />
      <section className="container page-title">
        <div className="eyebrow">学习成长</div>
        <h1>把学习轨迹变成升学、合作和自我介绍的证据。</h1>
        <p>这里展示研究兴趣、课程能力、阶段成果和项目化学习记录。访客也可以围绕学习方向继续向 AI 提问。</p>
      </section>
      <section className="container section">
        <SectionHeading
          title="学习档案"
          description="每条学习内容都可以被设置为公开展示，并同步到个人知识库。"
          action={
            <Link className="button" href="/chat?topic=study">
              <Bot size={16} />
              问学习方向
            </Link>
          }
        />
        <div className="grid two">
          {studyItems.map((item) => (
            <StudyCard key={item.id} item={item} />
          ))}
        </div>
      </section>
      <section className="container section">
        <div className="card">
          <div className="card-body">
            <GraduationCap color="#00a88a" size={28} />
            <h2>升学场景怎么用？</h2>
            <p>导师或同学可以直接询问研究兴趣、学习方法、项目经历和未来方向。系统只会基于公开且允许引用的知识回答。</p>
          </div>
        </div>
      </section>
    </main>
  );
}

