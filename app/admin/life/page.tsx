import { lifeRecords } from "@/lib/mock-data";

export default function AdminLifePage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">生活记录</div>
          <h1>管理照片信息流和可沉淀的生活记忆</h1>
        </div>
        <button className="button">发布记录</button>
      </header>
      <section className="grid three">
        {lifeRecords.map((record) => (
          <article className="admin-card" key={record.id}>
            <div className={`photo ${record.imageTone}`} style={{ minHeight: 150, borderRadius: 8, marginBottom: 14 }} />
            <h3>{record.title}</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>{record.excerpt}</p>
            <div className="chips">
              <span className={record.visibility === "public" ? "chip" : "chip coral"}>{record.visibility}</span>
              <span className={record.isAiUsable ? "chip cyan" : "chip coral"}>{record.isAiUsable ? "加入知识库" : "不引用"}</span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

