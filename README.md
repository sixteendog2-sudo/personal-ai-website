# Personal AI Digital Avatar

面向升学、社交和求职场景的个人 AI 网站。项目采用 Next.js 模块化单体架构，访客端、管理端、API 与 RAG 服务共享同一套类型和部署单元，生产数据存储于 PostgreSQL。

## 已实现

- 访客端：首页、AI 对话、学习、生活、项目、关于和联系页面。
- 管理端：知识库、访客问题、聊天日志、联系意向和运营统计。
- PostgreSQL：Drizzle schema、版本化迁移、可重复种子初始化。
- 数据隔离：所有核心表含 `owner_id`，公开查询强制检查发布状态与可见性。
- 知识闭环：PostgreSQL `pg_trgm` 数据库内检索；对话沉淀访客问题，管理员可在事务中转换为可检索知识。
- 管理员认证：数据库账号、bcrypt 密码哈希、7 天有效期签名 JWT、HttpOnly Cookie。
- DeepSeek：配置 Key 后调用真实模型；未配置时使用本地 RAG 回答用于开发。
- 运维：健康检查 `/api/health`、AI 调用日志表和管理员审计日志表。

## 本地环境

- Node.js `>=20.18`
- pnpm `11`
- PostgreSQL `17`（推荐；项目当前本机使用原生 Windows 服务，不依赖 Docker）

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

复制 `.env.example` 为 `.env.local`，至少配置：

```env
DATABASE_URL=postgresql://personal_ai_app:your-password@localhost:5432/personal_ai
DATABASE_MAX_CONNECTIONS=10
DATABASE_SSL=false
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
ADMIN_SESSION_TOKEN=replace-with-at-least-32-random-characters
```

真实模型调用还需配置 `DEEPSEEK_API_KEY`。`.env.local` 已被 Git 忽略，禁止提交真实密钥。

## 数据库工作流

修改 [db/schema.ts](./db/schema.ts) 后执行：

```bash
pnpm db:generate
pnpm db:migrate
```

`db/migrations/` 是生产迁移的权威记录；`db/schema.sql` 是早期完整设计参考，不应直接覆盖已迁移数据库。

## 验证

```bash
pnpm typecheck
pnpm build
```

运行后访问：

- 网站：`http://127.0.0.1:3000`
- 管理端：`http://127.0.0.1:3000/admin/login`
- 健康检查：`http://127.0.0.1:3000/api/health`

详细架构和迭代边界见 [生产后端架构](./docs/production-backend-architecture.md)。

## 后续生产增强

- 安装 pgvector 并将 `knowledge_chunks.embedding` 升级为向量列。
- 接入 S3、腾讯云 COS 或阿里云 OSS 管理原图与缩略图。
- 增加 Redis/托管限流服务和异步 embedding 任务队列。
- 完成后台内容 CRUD、媒体上传和管理员审计日志写入。
