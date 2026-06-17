import { Suspense } from "react";
import { SiteNav } from "@/components/SiteNav";
import { ChatClient } from "./ChatClient";

export default function ChatPage() {
  return (
    <main className="page">
      <SiteNav />
      <section className="container page-title">
        <div className="eyebrow">AI 咨询</div>
        <h1>直接问虚拟的我，答案来自个人知识库。</h1>
        <p>这个 demo 会保存会话和访客问题，管理员后台可以看到问题沉淀入口。</p>
      </section>
      <Suspense fallback={<div className="container card"><div className="card-body">正在加载聊天框...</div></div>}>
        <ChatClient />
      </Suspense>
    </main>
  );
}

