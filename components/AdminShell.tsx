"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Database,
  Home,
  Image,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  X
} from "lucide-react";

const nav = [
  { href: "/admin/audit-logs", label: "安全审计", icon: ShieldCheck },
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

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`admin-layout ${menuOpen ? "admin-menu-open" : ""}`}>
      <header className="admin-mobile-header">
        <span className="brand">
          <span className="brand-mark">AI</span>
          <span>管理后台</span>
        </span>
        <button className="admin-menu-button" type="button" aria-label="打开后台导航" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <Menu size={22} />
        </button>
      </header>
      <button className="admin-menu-backdrop" type="button" aria-label="关闭后台导航" onClick={() => setMenuOpen(false)} />
      <aside className="admin-sidebar">
        <div className="admin-sidebar-heading">
          <Link className="brand" href="/admin">
            <span className="brand-mark">AI</span>
            <span>Admin</span>
          </Link>
          <button className="admin-menu-button admin-menu-close" type="button" aria-label="关闭后台导航" onClick={() => setMenuOpen(false)}>
            <X size={22} />
          </button>
        </div>
        <nav className="admin-nav" aria-label="后台导航">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : undefined} onClick={() => setMenuOpen(false)}>
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action="/api/admin/auth/logout" method="post" className="admin-logout">
          <button className="button ghost" type="submit">
            <LogOut size={16} />
            退出登录
          </button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
