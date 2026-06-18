import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth";
import { listAuditLogs } from "@/lib/audit-store";

export default async function AdminAuditLogsPage() {
  const cookieStore = await cookies();
  const session = await verifyAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  const items = session ? await listAuditLogs(session.ownerId) : [];

  return <><header className="admin-header"><div><div className="eyebrow">安全审计</div><h1>管理员内容变更记录</h1></div></header><section className="admin-card">
    {items.length === 0 ? <p style={{ color: "var(--muted)" }}>暂无审计记录。</p> : <table className="table"><thead><tr><th>动作</th><th>资源</th><th>管理员</th><th>时间</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.action}</td><td>{item.resourceType} / {item.resourceId?.slice(0, 8)}</td><td>{item.adminUserId?.slice(0, 8)}</td><td>{item.createdAt.toLocaleString("zh-CN")}</td></tr>)}</tbody></table>}
  </section></>;
}
