import { QuestionsClient } from "./QuestionsClient";

export default function AdminQuestionsPage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">访客问题</div>
          <h1>把真实访客问题沉淀成知识资产</h1>
        </div>
      </header>
      <QuestionsClient />
    </>
  );
}
