import { getChatSessions } from "@/lib/runtime-store";

export default function AdminChatLogsPage() {
  const sessions = getChatSessions();

  return (
    <>
      <header className="admin-header">
        <div>
          <div className="eyebrow">聊天记录</div>
          <h1>查看访客会话、AI 回复和引用来源</h1>
        </div>
      </header>
      <section className="admin-card">
        {sessions.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>还没有真实聊天记录。去访客端发起一次对话后，这里会显示会话。</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>会话</th>
                <th>主题</th>
                <th>消息数</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.id.slice(0, 8)}</td>
                  <td>{session.topic}</td>
                  <td>{session.messages.length}</td>
                  <td>{new Date(session.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

