# 后端接口设计与数据隔离方案

## 1. 设计目标

本系统后端需要同时支撑三类能力：

- 访客端：浏览公开内容、与“虚拟的我”聊天、提交联系意图。
- 管理端：维护学习、生活、工作、知识库、访客问题和模型配置。
- AI/RAG：基于可引用知识生成回答，并沉淀访客问题。

核心要求：

- 公开内容、私密内容、AI 可引用内容必须隔离。
- 访客匿名数据和管理员数据必须隔离。
- 图片、生活记录、学习档案、工作项目都可以成为知识库来源。
- 大模型供应商可替换，DeepSeek 作为第一阶段聊天模型。
- 向量化能力独立于聊天模型，便于后续接入 OpenAI、Qwen、BGE、Jina 或本地 embedding 服务。

参考 DeepSeek 官方文档：https://api-docs.deepseek.com/

- DeepSeek API 兼容 OpenAI/Anthropic 风格，OpenAI 格式 base_url 为 `https://api.deepseek.com`。
- 聊天补全接口为 `/chat/completions`。
- 鉴权方式为 Bearer Token。
- 截至 2026-06-18，官方文档提示 `deepseek-chat` 和 `deepseek-reasoner` 将在 2026-07-24 15:59 UTC 废弃；MVP 默认模型建议使用 `deepseek-v4-flash`，并允许后台切换为 `deepseek-v4-pro`。

## 2. 技术架构建议

推荐第一阶段：

```text
Frontend: Next.js + TypeScript
Backend: Next.js Route Handlers / Server Actions
Database: PostgreSQL
Vector Search: pgvector
ORM: Prisma 或 Drizzle
Storage: 本地开发 / S3 / 腾讯云 COS / 阿里云 OSS
LLM Chat: DeepSeek API
Embedding: 可插拔供应商
Auth: 管理员 Session + HttpOnly Cookie
```

后端分层：

```text
API Routes
  -> Auth / Permission Guard
  -> Service Layer
  -> Repository / ORM
  -> PostgreSQL + pgvector
  -> External Providers: DeepSeek, Object Storage, Embedding Provider
```

## 3. 权限与数据隔离模型

### 3.1 用户类型

| 类型 | 说明 |
|---|---|
| `owner` | 站点主人，拥有全部后台管理权限 |
| `admin` | 管理员，可维护内容和知识库 |
| `visitor` | 匿名或半匿名访客，只能访问公开内容 |
| `system` | 系统任务，如向量化、问题沉淀、摘要生成 |

### 3.2 内容可见性

所有可展示或可进入知识库的内容都应包含以下字段：

```text
owner_id
visibility
is_ai_usable
is_public_indexable
status
```

字段含义：

| 字段 | 说明 |
|---|---|
| `owner_id` | 数据所属站点主人，预留多用户/多站点能力 |
| `visibility` | `public` 公开、`unlisted` 不公开但可直链、`private` 私密 |
| `is_ai_usable` | 是否允许进入 RAG 检索，被 AI 引用 |
| `is_public_indexable` | 是否允许被搜索引擎索引 |
| `status` | `draft` 草稿、`published` 发布、`archived` 归档 |

隔离规则：

- 访客接口只能读取 `visibility = public` 且 `status = published` 的内容。
- AI 检索只能读取 `is_ai_usable = true` 且未归档的知识块。
- 私密内容可以保存在后台，但默认不能被访客看到，也不能被 AI 引用。
- 聊天记录、访客问题默认只管理员可见。
- API Key、系统提示词、模型设置只能管理员可见。

### 3.3 推荐开启 PostgreSQL Row Level Security

MVP 可以先在服务层做权限控制，但数据库设计应预留 RLS。

建议策略：

```text
admin session -> 可访问 owner_id 匹配的数据
visitor session -> 只能访问 public/published 内容
system job -> 只能访问任务允许的 owner_id 数据
```

## 4. API 分组

统一前缀：

```text
/api/public/*
/api/visitor/*
/api/admin/*
/api/internal/*
```

说明：

- `/api/public/*`：公开浏览接口，不需要登录。
- `/api/visitor/*`：访客行为接口，如聊天、留言、反馈，可匿名。
- `/api/admin/*`：管理员后台接口，需要登录。
- `/api/internal/*`：系统内部任务接口，禁止浏览器直接调用。

## 5. 访客端接口

### 5.1 获取站点公开信息

```http
GET /api/public/site
```

返回：

```json
{
  "profile": {},
  "navigation": [],
  "featureFlags": {
    "chatEnabled": true,
    "lifeEnabled": true,
    "contactEnabled": true
  }
}
```

### 5.2 首页聚合

```http
GET /api/public/home
```

返回内容：

- 个人简介
- 三条主线入口：学习、生活、工作
- 最近生活记录
- 代表项目
- 学习亮点
- 推荐问题

### 5.3 生活记录列表

```http
GET /api/public/life-records?tag=旅行&page=1&pageSize=20
```

过滤条件：

- 只返回 `visibility = public`
- 只返回 `status = published`

### 5.4 生活记录详情

```http
GET /api/public/life-records/:id
```

返回：

- 图片组
- 标题
- 时间
- 地点
- 正文
- 标签
- 相关记录
- 是否可围绕该记录发起聊天

### 5.5 学习成长

```http
GET /api/public/study
GET /api/public/study/:id
```

展示：

- 学习概览
- 课程与能力
- 研究兴趣
- 竞赛证书
- 学习成果
- 相关生活记录

### 5.6 工作项目

```http
GET /api/public/work
GET /api/public/work/:id
```

展示：

- 职业目标
- 技能栈
- 项目列表
- 项目详情
- 实习/工作经历
- 简历入口

### 5.7 联系意图提交

```http
POST /api/visitor/contact-intents
```

请求：

```json
{
  "intent": "admission",
  "name": "访客昵称",
  "contact": "email@example.com",
  "message": "想进一步交流项目经历"
}
```

`intent` 可选：

- `admission` 升学
- `social` 社交
- `career` 求职
- `collaboration` 合作
- `other` 其他

## 6. 访客聊天接口

### 6.1 创建聊天会话

```http
POST /api/visitor/chat/sessions
```

请求：

```json
{
  "entry": "home",
  "topic": "career",
  "relatedRecordId": null
}
```

返回：

```json
{
  "sessionId": "uuid",
  "suggestedQuestions": []
}
```

### 6.2 发送消息

```http
POST /api/visitor/chat/sessions/:sessionId/messages
```

请求：

```json
{
  "message": "介绍一下你的项目经历",
  "context": {
    "topic": "work",
    "relatedRecordId": null
  }
}
```

处理流程：

```text
1. 校验访客会话
2. 保存用户消息
3. 做问题安全检查和长度限制
4. 根据 topic / relatedRecordId / message 检索知识库
5. 组装系统提示词、知识上下文、聊天历史
6. 调用 DeepSeek chat completions
7. 保存 AI 回复
8. 保存 visitor_question
9. 返回回答和引用来源
```

返回：

```json
{
  "answer": "可以，我做过...",
  "citations": [
    {
      "sourceType": "work_project",
      "sourceId": "uuid",
      "title": "个人 AI 网站"
    }
  ],
  "questionId": "uuid"
}
```

### 6.3 反馈 AI 回答

```http
POST /api/visitor/chat/messages/:messageId/feedback
```

请求：

```json
{
  "rating": "useful",
  "comment": "回答挺清楚"
}
```

## 7. 管理端接口

### 7.1 管理员认证

```http
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET /api/admin/auth/me
```

要求：

- 登录成功后使用 HttpOnly Cookie。
- 管理接口必须校验 Session。
- API Key 不得返回明文。

### 7.2 后台首页

```http
GET /api/admin/dashboard
```

返回：

- 访客数
- 聊天会话数
- 知识条目数
- 待整理问题数
- 最近问题
- 模型状态

### 7.3 个人资料管理

```http
GET /api/admin/profile
PUT /api/admin/profile
```

用于维护：

- 基础信息
- 头像
- 个人标签
- 关于我
- 联系方式
- 公开状态
- 是否进入知识库

### 7.4 学习档案管理

```http
GET /api/admin/study-items
POST /api/admin/study-items
GET /api/admin/study-items/:id
PUT /api/admin/study-items/:id
DELETE /api/admin/study-items/:id
POST /api/admin/study-items/:id/publish
POST /api/admin/study-items/:id/sync-knowledge
```

### 7.5 工作项目管理

```http
GET /api/admin/work-projects
POST /api/admin/work-projects
GET /api/admin/work-projects/:id
PUT /api/admin/work-projects/:id
DELETE /api/admin/work-projects/:id
POST /api/admin/work-projects/:id/publish
POST /api/admin/work-projects/:id/sync-knowledge
```

### 7.6 生活记录管理

```http
GET /api/admin/life-records
POST /api/admin/life-records
GET /api/admin/life-records/:id
PUT /api/admin/life-records/:id
DELETE /api/admin/life-records/:id
POST /api/admin/life-records/:id/publish
POST /api/admin/life-records/:id/sync-knowledge
```

### 7.7 图片素材库

```http
GET /api/admin/assets
POST /api/admin/assets/upload-url
POST /api/admin/assets/complete
DELETE /api/admin/assets/:id
```

上传建议：

- 后端签发上传 URL。
- 文件上传到对象存储。
- 完成后写入 `media_assets`。
- 生成缩略图和基础元数据。

### 7.8 知识库管理

```http
GET /api/admin/knowledge-items
POST /api/admin/knowledge-items
GET /api/admin/knowledge-items/:id
PUT /api/admin/knowledge-items/:id
DELETE /api/admin/knowledge-items/:id
POST /api/admin/knowledge-items/:id/chunk
POST /api/admin/knowledge-items/:id/embed
POST /api/admin/knowledge-items/:id/reindex
```

### 7.9 访客问题沉淀

```http
GET /api/admin/visitor-questions
GET /api/admin/visitor-questions/:id
PUT /api/admin/visitor-questions/:id
POST /api/admin/visitor-questions/:id/convert-to-knowledge
POST /api/admin/visitor-questions/:id/ignore
```

问题状态：

- `new`
- `valuable`
- `converted`
- `ignored`

### 7.10 聊天记录

```http
GET /api/admin/chat-sessions
GET /api/admin/chat-sessions/:id
GET /api/admin/chat-sessions/:id/messages
```

### 7.11 模型设置

```http
GET /api/admin/settings/model
PUT /api/admin/settings/model
POST /api/admin/settings/model/test
```

配置项：

- `chat_provider`
- `chat_base_url`
- `chat_model`
- `encrypted_api_key`
- `temperature`
- `top_p`
- `max_tokens`
- `timeout_ms`
- `stream_enabled`

### 7.12 提示词设置

```http
GET /api/admin/settings/prompts
POST /api/admin/settings/prompts
PUT /api/admin/settings/prompts/:id
POST /api/admin/settings/prompts/:id/activate
```

提示词场景：

- `default`
- `admission`
- `career`
- `social`
- `life`
- `project`

## 8. 内部任务接口

内部接口只允许系统任务或管理员触发，不对访客开放。

```http
POST /api/internal/knowledge/chunk
POST /api/internal/knowledge/embed
POST /api/internal/knowledge/reindex
POST /api/internal/questions/summarize
POST /api/internal/chat/moderate
```

建议：

- 内部接口使用服务端密钥或任务队列调用。
- 生产环境不要直接暴露公网。
- 后续可迁移到队列：BullMQ、Cloud Tasks、Temporal。

## 9. RAG 回答策略

### 9.1 检索过滤条件

AI 检索必须带上过滤条件：

```text
owner_id = currentOwnerId
is_ai_usable = true
status != archived
source visibility in allowed scope
```

访客聊天默认 scope：

```text
public_ai
```

即：

```text
visibility = public
is_ai_usable = true
```

管理员调试可使用：

```text
admin_preview
```

即允许预览私密知识，但必须明确标记，不能返回给访客。

### 9.2 Prompt 结构

```text
System Prompt:
你是站点主人的 AI 分身助手。你必须基于知识库回答，不得编造经历。

Profile Context:
公开个人资料摘要

Retrieved Knowledge:
检索到的知识片段，带 sourceId/sourceType/title

Conversation History:
最近 N 轮对话

User Question:
访客问题
```

### 9.3 无知识命中策略

如果知识库没有命中：

- 不编造。
- 可以说明“我目前没有这方面记录”。
- 可以推荐访客查看公开页面或联系本人。
- 保存为访客问题，供后台后续沉淀。

## 10. 审计与安全

必须记录：

- 管理员登录日志。
- 管理员内容变更日志。
- 知识库同步日志。
- AI 调用日志。
- 访客问题沉淀日志。

安全要求：

- API Key 加密存储。
- 管理接口限流。
- 访客聊天限流。
- 图片上传校验文件类型和大小。
- 私密内容不进入公开接口响应。
- AI 回复不得泄露私密字段。
