import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import {
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Database,
  Home,
  Image,
  Mail,
  MessageSquareText,
  Settings,
  Sparkles,
  UserRound
} from "lucide-react";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth";

const nav = [
  { href: "/admin/contact-intents", label: "联系意向", icon: Mail },
  { href: "/admin", label: "后台首页", icon: Home },
  { href: "/admin/profile", label: "个人资料", icon: UserRound },
  { href: "/admin/study", label: "学习档案", icon: BookOpen },
  { href: "/admin/work", label: "工作项目", icon: BriefcaseBusiness },
  { href: "/admin/life", label: "生活记录", icon: Image },
  { href: "/admin/knowledge", label: "知识库", icon: Database },
  { href: "/admin/questions", label: "访客问题", icon: MessageSquareText },
  { href: "/admin/chat-logs", label: "聊天记录", icon: Brain },
  { href: "/admin/settings/model", label: "模型设置", icon: Settings },
  { href: "/admin/settings/prompt", label: "提示词配置", icon: Sparkles }
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const authenticated = Boolean(await verifyAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value));

  if (!authenticated) {
    return children;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/" style={{ color: "white", marginBottom: 28 }}>
          <span className="brand-mark">AI</span>
          <span>Admin</span>
        </Link>
        <nav style={{ display: "grid", gap: 8 }}>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action="/api/admin/auth/logout" method="post" style={{ marginTop: 20 }}>
          <button className="button ghost" type="submit" style={{ width: "100%" }}>
            退出登录
          </button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
