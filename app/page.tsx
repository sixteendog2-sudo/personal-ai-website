import Link from "next/link";
import { Bot, BriefcaseBusiness, GraduationCap, Image, MessageCircle, Sparkles } from "lucide-react";
import { LifeRecordCard, StudyCard, WorkProjectCard } from "@/components/Cards";
import { SectionHeading } from "@/components/SectionHeading";
import { SiteNav } from "@/components/SiteNav";
import { lifeRecords, profile, studyItems, workProjects } from "@/lib/mock-data";

export default function HomePage() {
  const publicLife = lifeRecords.filter((item) => item.visibility === "public" && item.status === "published");

  return (
    <main className="page">
      <SiteNav />
      <section className="container hero">
        <div className="hero-copy">
          <div className="eyebrow">成熟且有活力的个人 AI 数字分身</div>
          <h1>把学习、生活和工作，整理成一个会回答问题的个人主页。</h1>
          <p>{profile.bio}</p>
          <div className="hero-actions">
            <Link className="button" href="/chat">
              <Bot size={17} />
              与虚拟的我对话
            </Link>
            <Link className="button secondary" href="/life">
              <Image size={17} />
              查看生活记录
            </Link>
          </div>
          <div className="chips">
            <span className="chip">升学</span>
            <span className="chip coral">社交</span>
            <span className="chip cyan">求职</span>
          </div>
        </div>
        <div className="hero-panel">
          <Link className="orbit-card teal" href="/study">
            <GraduationCap size={22} />
            <strong>学习成长</strong>
            <span>研究兴趣、课程能力、竞赛证书和阶段成果。</span>
          </Link>
          <Link className="orbit-card coral" href="/life">
            <Sparkles size={22} />
            <strong>生活记录</strong>
            <span>像信息流一样浏览照片、日常和真实想法。</span>
          </Link>
          <Link className="orbit-card cyan" href="/work">
            <BriefcaseBusiness size={22} />
            <strong>工作项目</strong>
            <span>项目经历、技能栈、个人角色和成果证据。</span>
          </Link>
        </div>
      </section>

      <section className="container section">
        <SectionHeading
          eyebrow="最近更新"
          title="生活记录不是相册，是会进入知识库的记忆"
          description="公开且允许 AI 引用的生活记录，会成为访客提问时的真实上下文。"
          action={
            <Link className="button ghost" href="/life">
              查看全部
            </Link>
          }
        />
        <div className="feed-grid">
          {publicLife.slice(0, 3).map((record, index) => (
            <LifeRecordCard key={record.id} record={record} tall={index === 1} />
          ))}
        </div>
      </section>

      <section className="container section">
        <SectionHeading
          eyebrow="升学和求职"
          title="用项目和学习轨迹解释自己"
          description="老师、HR、朋友进入网站时，都能沿着自己关心的路径理解我。"
        />
        <div className="grid two">
          <div className="grid">
            {studyItems.map((item) => (
              <StudyCard key={item.id} item={item} />
            ))}
          </div>
          <div className="grid">
            {workProjects.map((project) => (
              <WorkProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="card">
          <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div>
              <span className="chip cyan">推荐问题</span>
              <h2>想了解得更具体？直接问虚拟的我。</h2>
              <p>例如：你适合什么研究方向？你做过哪些项目？平时有什么兴趣？怎么联系你？</p>
            </div>
            <Link className="button coral" href="/chat">
              <MessageCircle size={18} />
              开始咨询
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

