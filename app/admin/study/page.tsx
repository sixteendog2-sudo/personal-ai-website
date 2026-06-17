import { studyItems } from "@/lib/mock-data";

export default function AdminStudyPage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">学习档案</div>
          <h1>管理升学和学习成长相关内容</h1>
        </div>
        <button className="button">新增学习内容</button>
      </header>
      <section className="admin-card">
        <table className="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>类型</th>
              <th>周期</th>
              <th>标签</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {studyItems.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.type}</td>
                <td>{item.period}</td>
                <td>{item.tags.join(" / ")}</td>
                <td><span className="chip">已发布</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

