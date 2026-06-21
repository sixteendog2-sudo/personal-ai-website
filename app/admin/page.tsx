import Link from "next/link";
import { getDashboardMetrics } from "@/lib/dashboard-store";

export default async function AdminDashboardPage() {
  const dashboard = await getDashboardMetrics();
  const metrics = [
    ["知识条目", dashboard.aiUsableKnowledge, "teal"],
    ["生活记录", dashboard.lifeRecords, "cyan"],
    ["学习档案", dashboard.studyItems, "lime"],
    ["工作项目", dashboard.workProjects, "coral"],
    ["待整理问题", dashboard.pendingQuestions, "coral"]
  ];

  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">后台首页</div>
          <h1>内容维护、知识沉淀和 AI 配置中心</h1>
        </div>
        <Link className="button" href="/chat">
          测试访客聊天
        </Link>
      </header>
      <section className="admin-grid">
        {metrics.map(([label, value, tone]) => (
          <div className="admin-card" key={label}>
            <p style={{ color: "var(--muted)", margin: 0 }}>{label}</p>
            <div className="metric" style={{ color: `var(--${tone})` }}>
              {value}
            </div>
          </div>
        ))}
      </section>
      <section className="section">
        <div className="admin-card">
          <h2>待办建议</h2>
          <table className="table">
            <tbody>
              <tr>
                <td>定期检查访客问题并沉淀优质知识</td>
                <td><span className="chip coral">运营</span></td>
              </tr>
              <tr>
                <td>部署前配置私有 S3/COS/OSS 图片存储</td>
                <td><span className="chip">部署</span></td>
              </tr>
              <tr>
                <td>定期备份 PostgreSQL 与对象存储</td>
                <td><span className="chip cyan">运维</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
