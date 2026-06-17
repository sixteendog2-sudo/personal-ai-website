# 项目设计交付索引

本目录保存个人 AI 数字分身网站的顶层设计资产，后续开发以这些文件为依据。

## 1. UI 与页面设计

| 文件 | 说明 |
|---|---|
| `docs/ui-page-spec.md` | UI 风格规范、组件清单、前台/后台页面规格 |
| `docs/design-assets/visitor-ui-board.png` | 访客端页面设计归档图 |
| `docs/design-assets/visitor-ui-board.svg` | 访客端页面设计归档矢量版 |
| `docs/design-assets/admin-ui-board.png` | 管理端页面设计归档图 |
| `docs/design-assets/admin-ui-board.svg` | 管理端页面设计归档矢量版 |
| `docs/design-assets/final-ui-image-prompts.md` | 早期 imagegen 视觉稿提示词归档 |

## 2. 后端与数据设计

| 文件 | 说明 |
|---|---|
| `docs/backend-api-design.md` | 后端接口设计、权限边界、访客/管理员/API 分组 |
| `docs/database-architecture.md` | 数据库架构、核心实体、隔离模型、知识库表说明 |
| `docs/knowledge-base-rag-design.md` | 个人知识库、RAG、分块、向量化、检索和隐私策略 |
| `db/schema.sql` | PostgreSQL + pgvector 数据表 SQL 草案 |

## 3. 设计结论

产品定位：

```text
成熟且有活力的个人 AI 数字分身网站。
围绕学习、生活、工作三条主线，服务升学、社交、求职。
```

核心架构：

```text
访客端
  -> 公开内容浏览
  -> AI 咨询
  -> 联系意图提交

管理端
  -> 个人资料维护
  -> 学习档案维护
  -> 工作项目维护
  -> 生活记录维护
  -> 知识库维护
  -> 访客问题沉淀
  -> 模型与提示词配置

AI/RAG
  -> 检索可公开且可 AI 引用的知识
  -> 调用 DeepSeek 聊天模型
  -> 保存回答、引用来源和访客问题
```

## 4. MVP 建议

第一阶段优先开发：

```text
1. 管理员登录
2. 个人资料
3. 知识库 CRUD
4. 生活记录 CRUD
5. 工作项目 CRUD
6. 访客聊天
7. DeepSeek 模型配置
8. 知识分块与向量检索
9. 聊天记录与访客问题沉淀
```

第二阶段扩展：

```text
1. 学习档案完善
2. 图片素材库
3. 联系意图管理
4. 访客问题一键转知识
5. 混合检索和重排序
6. 数据统计看板
7. 多模型供应商切换
```

