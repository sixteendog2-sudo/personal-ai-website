# 生产后端架构

## 架构选择

当前采用 **Next.js 模块化单体 + PostgreSQL**，而不是提前拆分 Go/Python 微服务。

原因：当前业务由个人内容、知识库、聊天和管理后台构成，数据关系紧密，访问规模尚未证明需要独立服务。模块化单体能保持单次部署和事务一致性，同时通过 store/service 边界保留未来拆分能力。Python 可在后续作为离线 embedding 或媒体处理 worker，Go 可在明确出现高并发网关需求后引入。

```text
Browser
  -> Next.js pages / Route Handlers
     -> auth / validation
     -> domain stores
        -> Drizzle ORM
           -> PostgreSQL
     -> RAG retrieval
        -> DeepSeek Chat API
```

## 模块边界

| 模块 | 主要代码 | 数据表 |
|---|---|---|
| 认证 | `lib/auth.ts`, `lib/admin-auth.ts` | `admin_users` |
| 内容 | `lib/content-store.ts` | `content_items`, `media_assets`, `content_media` |
| 聊天 | `lib/chat-store.ts`, `lib/ai.ts` | `chat_sessions`, `chat_messages` |
| 知识库 | `lib/knowledge-store.ts`, `lib/knowledge.ts` | `knowledge_items`, `knowledge_chunks` |
| 访客沉淀 | `lib/knowledge-store.ts` | `visitor_questions` |
| 联系意向 | `lib/contact-store.ts` | `contact_intents` |
| 运营统计 | `lib/dashboard-store.ts` | 聚合查询，不单独存储 |

Route Handler 负责 HTTP 解析和响应；store 负责查询与事务；AI 层负责检索、Prompt 和模型供应商调用。页面不得直接写数据库。

## 数据隔离

- 核心业务表必须携带 `owner_id`。
- 所有 store 查询显式约束当前 owner，禁止只按资源 ID 查询。
- 访客内容查询必须同时满足 `status = published` 和 `visibility = public`。
- RAG 还必须满足 `is_ai_usable = true`。
- 管理员 Cookie 使用 HttpOnly、SameSite=Lax；生产 HTTPS 下自动启用 Secure。
- 密码使用 bcrypt 成本因子 12，Cookie 内仅放签名 JWT，不放密码或 API Key。

## 数据库迁移

`db/schema.ts` 与 `db/migrations/` 是数据库结构的权威来源。迁移只能前进，不在生产环境手工修改已经执行的迁移文件。

本机原生 PostgreSQL 初始化顺序：

1. 创建非超级用户应用账号。
2. 创建由应用账号持有的独立数据库。
3. 配置 `.env.local`。
4. 执行 `pnpm db:migrate`。
5. 执行 `pnpm db:seed` 创建租户、管理员、示例内容与知识。

## 检索与 pgvector 演进

当前生产主路径启用 PostgreSQL `pg_trgm`：数据库内先执行租户、发布状态、可见性与 AI 可用性过滤，再按标题、正文、分类和标签相似度选择候选，应用层进行场景重排。迁移同时创建 3 个 GIN trigram 索引。

Windows 原生 PostgreSQL 安装默认不包含 pgvector。Visual Studio C++ Build Tools 已是本机唯一额外编译依赖，管理员可运行 `scripts/install-pgvector-windows.ps1` 按 pgvector 官方 Windows 流程安装扩展。当前机器尚未完成需要 UAC 的最终文件复制，因此不得声称向量检索已经启用。

生产启用向量检索时应独立提交迁移：安装 `vector` 扩展、创建固定维度 `vector(n)` 列、建立 HNSW 索引、记录 embedding 模型与维度，并采用“关键词 + 向量 + 关联记录加权”的混合检索。扩展迁移必须在目标数据库验证后再发布。

## Git 迭代约定

每个提交只覆盖一个可验证模块：

- schema/迁移与业务代码尽量在同一模块提交；
- 提交前运行类型检查和目标接口测试；
- 跨模块最终运行生产构建；
- 迁移提交不得与纯 UI 调整混合。
