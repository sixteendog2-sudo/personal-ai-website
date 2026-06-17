import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Database,
  Home,
  Image,
  MessageSquareText,
  Settings,
  Sparkles,
  UserRound
} from "lucide-react";

const nav = [
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

export default function AdminLayout({ children }: { children: ReactNode }) {
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
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

