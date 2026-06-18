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

## pgvector 演进

Windows 原生 PostgreSQL 安装默认不包含 pgvector。当前 `knowledge_chunks.embedding` 保留兼容字段，检索采用受权限约束的关键词相关度，确保业务先可运行。

生产启用向量检索时应独立提交迁移：安装 `vector` 扩展、创建固定维度 `vector(n)` 列、建立 HNSW 索引、记录 embedding 模型与维度，并采用“关键词 + 向量 + 关联记录加权”的混合检索。扩展迁移必须在目标数据库验证后再发布。

## Git 迭代约定

每个提交只覆盖一个可验证模块：

- schema/迁移与业务代码尽量在同一模块提交；
- 提交前运行类型检查和目标接口测试；
- 跨模块最终运行生产构建；
- 迁移提交不得与纯 UI 调整混合。
