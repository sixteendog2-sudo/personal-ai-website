import { listContactIntents } from "@/lib/contact-store";

export default async function AdminContactIntentsPage() {
  const items = await listContactIntents();
  return <><header className="admin-header"><div><div className="eyebrow">联系意向</div><h1>查看访客主动留下的合作、升学、社交和求职意向</h1></div></header><section className="admin-card">
    {items.length === 0 ? <p style={{ color: "var(--muted)" }}>暂时没有新的联系意向。</p> : <table className="table"><thead><tr><th>称呼</th><th>目的</th><th>联系方式</th><th>留言</th><th>时间</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.purpose}</td><td>{item.contact}</td><td>{item.message}</td><td>{item.createdAt.toLocaleString("zh-CN")}</td></tr>)}</tbody></table>}
  </section></>;
}
