import Link from "next/link";
import { knowledgeItems, lifeRecords, studyItems, workProjects } from "@/lib/mock-data";
import { getVisitorQuestions } from "@/lib/runtime-store";

export default function AdminDashboardPage() {
  const questions = getVisitorQuestions();
  const metrics = [
    ["知识条目", knowledgeItems.filter((item) => item.isAiUsable).length, "teal"],
    ["生活记录", lifeRecords.length, "cyan"],
    ["学习档案", studyItems.length, "lime"],
    ["工作项目", workProjects.length, "coral"],
    ["待整理问题", questions.filter((item) => item.status === "new").length, "coral"]
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
                <td>把真实个人资料替换 mock 数据</td>
                <td><span className="chip coral">P0</span></td>
              </tr>
              <tr>
                <td>接入 PostgreSQL + pgvector</td>
                <td><span className="chip">P0</span></td>
              </tr>
              <tr>
                <td>配置 DeepSeek API Key 并开启真实模型调用</td>
                <td><span className="chip cyan">P1</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

