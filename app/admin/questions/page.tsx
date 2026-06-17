import { getVisitorQuestions } from "@/lib/runtime-store";

const fallbackQuestions = [
  {
    id: "demo-q-1",
    question: "介绍一下你的项目经历",
    answer: "可以，从公开记录看，他正在构建个人 AI 数字分身网站。",
    topic: "career",
    status: "new",
    createdAt: "demo"
  },
  {
    id: "demo-q-2",
    question: "你适合什么研究方向？",
    answer: "目前比较关注 AI 应用、个人知识管理和 RAG。",
    topic: "admission",
    status: "valuable",
    createdAt: "demo"
  }
];

export default function AdminQuestionsPage() {
  const questions = getVisitorQuestions();
  const rows = questions.length ? questions : fallbackQuestions;

  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">访客问题</div>
          <h1>把真实访客问题沉淀成知识资产</h1>
        </div>
        <button className="button coral">问题转知识</button>
      </header>
      <section className="admin-card">
        <table className="table">
          <thead>
            <tr>
              <th>问题</th>
              <th>主题</th>
              <th>状态</th>
              <th>AI 原回答</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>{item.question}</td>
                <td>{item.topic}</td>
                <td><span className={item.status === "new" ? "chip coral" : "chip lime"}>{item.status}</span></td>
                <td>{item.answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

