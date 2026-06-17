import Link from "next/link";
import { Bot, MapPin, Tags } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { profile } from "@/lib/mock-data";

export default function AboutPage() {
  return (
    <main className="page">
      <SiteNav />
      <section className="container page-title">
        <div className="eyebrow">关于我</div>
        <h1>{profile.headline}</h1>
        <p>{profile.bio}</p>
      </section>
      <section className="container section grid two">
        <div className="card">
          <div className="card-body">
            <MapPin color="#00a88a" size={28} />
            <h2>基本信息</h2>
            <p className="prose">昵称：{profile.nickname}</p>
            <p className="prose">城市：{profile.city}</p>
            <p className="prose">定位：学习、生活、工作三条主线的持续记录者。</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <Tags color="#ff6b5f" size={28} />
            <h2>关键词</h2>
            <div className="chips">
              {profile.tags.map((tag, index) => (
                <span className={`chip ${index % 3 === 1 ? "coral" : index % 3 === 2 ? "cyan" : ""}`} key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="card">
          <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div>
              <h2>还想知道更具体的事？</h2>
              <p>可以问虚拟的我，它会基于公开知识库回答，不会编造未记录的信息。</p>
            </div>
            <Link className="button" href="/chat">
              <Bot size={16} />
              开始咨询
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

