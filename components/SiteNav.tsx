import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";

const links = [
  { href: "/study", label: "学习成长" },
  { href: "/life", label: "生活记录" },
  { href: "/work", label: "工作项目" },
  { href: "/about", label: "关于我" },
  { href: "/contact", label: "联系我" }
];

export function SiteNav() {
  return (
    <header className="site-nav">
      <div className="container site-nav-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">AI</span>
          <span>个人数字分身</span>
        </Link>
        <nav className="nav-links" aria-label="主导航">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="button secondary" href="/admin">
            <Sparkles size={16} />
            后台
          </Link>
          <Link className="button" href="/chat">
            <Bot size={16} />
            开始咨询
          </Link>
        </div>
      </div>
    </header>
  );
}

