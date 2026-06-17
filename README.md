# Personal AI Digital Avatar

这是一个面向升学、社交、求职场景的个人 AI 数字分身网站 demo。

当前 demo 已包含：

- 访客端：首页、AI 对话、学习成长、生活记录、工作项目、关于我、联系我。
- 管理端：后台首页、个人资料、知识库、学习档案、工作项目、生活记录、访客问题、聊天记录、模型设置、提示词配置。
- API：公开内容接口、访客聊天接口、管理端数据接口。
- 知识库：本地 mock RAG 检索，按 `visibility + status + isAiUsable` 隔离数据。
- DeepSeek：预留真实调用，未配置 key 时自动使用本地模拟回答。
- 管理员保护：`/admin` 和 `/api/admin/*` 默认需要登录，demo 密码为 `demo123456`。
- 设计文档：`docs/`。
- 数据库草案：`db/schema.sql`。

## 本地运行

```bash
pnpm install
pnpm dev
```

如果本机没有 pnpm，也可以使用 Codex 内置运行时执行：

```powershell
& "C:\Users\SIXTEENDOG\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" `
  "C:\Users\SIXTEENDOG\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.cjs" install
```

## 环境变量

复制 `.env.example` 为 `.env.local`，按需填入：

```bash
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-v4-flash
ADMIN_PASSWORD=demo123456
ADMIN_SESSION_TOKEN=replace-with-a-long-random-secret
DATABASE_URL=
```

## Vercel 部署

1. 将本项目推送到 GitHub。
2. 在 Vercel 导入仓库。
3. Framework 选择 Next.js。
4. 设置环境变量。
5. 部署。

## 下一步

- 将 mock 数据替换为 PostgreSQL + pgvector。
- 接入真实对象存储。
- 接入真实管理员认证。
- 使用后台操作沉淀访客问题到知识库。
