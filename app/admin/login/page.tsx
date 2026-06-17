import Link from "next/link";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";
  const next = params.next ?? "/admin";

  return (
    <main className="page" style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 20 }}>
      <section className="card" style={{ width: "min(460px, 100%)" }}>
        <div className="card-body">
          <div className="eyebrow">管理员登录</div>
          <h1 style={{ marginBottom: 8 }}>进入个人 AI 后台</h1>
          <p>Demo 默认密码是 <strong>demo123456</strong>。上线时请通过环境变量 `ADMIN_PASSWORD` 替换。</p>
          {hasError ? <p className="chip coral">密码不正确，请重试。</p> : null}
          <form action="/api/admin/auth/login" method="post" className="field" style={{ marginTop: 18 }}>
            <input type="hidden" name="next" value={next} />
            <label htmlFor="password">管理员密码</label>
            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="输入管理员密码" required />
            <button className="button" type="submit" style={{ marginTop: 8 }}>
              登录后台
            </button>
          </form>
          <Link className="button secondary" href="/" style={{ marginTop: 12 }}>
            返回访客首页
          </Link>
        </div>
      </section>
    </main>
  );
}

