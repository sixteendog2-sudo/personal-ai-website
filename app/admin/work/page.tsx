import { workProjects } from "@/lib/mock-data";

export default function AdminWorkPage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">工作项目</div>
          <h1>管理求职、实习和合作展示的项目内容</h1>
        </div>
        <button className="button">发布项目</button>
      </header>
      <section className="admin-card">
        <table className="table">
          <thead>
            <tr>
              <th>项目</th>
              <th>角色</th>
              <th>技术栈</th>
              <th>AI 可用</th>
            </tr>
          </thead>
          <tbody>
            {workProjects.map((project) => (
              <tr key={project.id}>
                <td>{project.title}</td>
                <td>{project.role}</td>
                <td>{project.techStack.join(" / ")}</td>
                <td><span className="chip cyan">可用于AI回答</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

