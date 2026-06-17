import { knowledgeItems } from "@/lib/mock-data";

export default function AdminKnowledgePage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">知识库</div>
          <h1>管理可被 AI 检索和引用的个人知识</h1>
        </div>
        <button className="button">新建知识</button>
      </header>
      <section className="admin-card">
        <table className="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>来源</th>
              <th>可见性</th>
              <th>AI 可用</th>
            </tr>
          </thead>
          <tbody>
            {knowledgeItems.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td>{item.sourceType}</td>
                <td><span className={item.visibility === "public" ? "chip" : "chip coral"}>{item.visibility}</span></td>
                <td><span className={item.isAiUsable ? "chip cyan" : "chip coral"}>{item.isAiUsable ? "可用于AI回答" : "不可引用"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

