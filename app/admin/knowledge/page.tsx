import { KnowledgeClient } from "./KnowledgeClient";

export default function AdminKnowledgePage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">知识库</div>
          <h1>管理可被 AI 检索和引用的个人知识</h1>
        </div>
      </header>
      <KnowledgeClient />
    </>
  );
}
