import type { KnowledgeItem, LifeRecord, Profile, StudyItem, WorkProject } from "./types";

export const OWNER_ID = "demo-owner";

export const profile: Profile = {
  ownerId: OWNER_ID,
  nickname: "Sixteen",
  realName: "网站主人",
  headline: "一个正在把学习、生活和工作认真记录下来的年轻人",
  bio: "我希望这个网站像一个会成长的个人档案：既能展示真实生活，也能在升学、社交和求职时，让别人更快理解我的经历、能力和性格。",
  city: "China",
  contact: {
    email: "hello@example.com",
    github: "https://github.com/sixteendog2-sudo",
    wechat: "后台可配置"
  },
  tags: ["AI", "个人知识库", "学习成长", "项目实践", "生活记录"],
  visibility: "public",
  status: "published",
  isAiUsable: true
};

export const lifeRecords: LifeRecord[] = [
  {
    id: "life-001",
    ownerId: OWNER_ID,
    title: "把这个网站当成自己的成长档案",
    excerpt: "开始认真记录学习、生活和工作之后，我发现很多经历都有再次被看见的价值。",
    body: "我想做一个不是普通简历、也不是普通相册的网站。它可以记录我的学习过程、生活片段和项目实践，也能让访客通过 AI 问到更具体的问题。这个想法本身也会成为我的一个长期项目。",
    occurredAt: "2026-06-18",
    location: "个人网站计划",
    mood: "兴奋",
    tags: ["成长", "AI", "记录"],
    imageTone: "teal",
    visibility: "public",
    status: "published",
    isAiUsable: true
  },
  {
    id: "life-002",
    ownerId: OWNER_ID,
    title: "一次适合写进生活记录的周末",
    excerpt: "没有特别宏大的事情，但有一些值得留住的小瞬间。",
    body: "我喜欢把生活里的细节留下来，比如一次散步、一次阅读、一次和朋友的聊天。这些记录不一定直接服务求职或升学，但会让别人看到一个更完整的人。",
    occurredAt: "2026-05-25",
    location: "城市角落",
    mood: "松弛",
    tags: ["日常", "社交", "观察"],
    imageTone: "coral",
    visibility: "public",
    status: "published",
    isAiUsable: true
  },
  {
    id: "life-003",
    ownerId: OWNER_ID,
    title: "学习 AI 产品设计的一天",
    excerpt: "从需求、页面、数据和模型调用一起看，产品会更完整。",
    body: "这天我意识到，AI 产品不只是接一个模型 API。真正重要的是数据如何维护、知识如何沉淀、用户问题如何反馈到系统里。这也是我设计个人知识库的原因。",
    occurredAt: "2026-04-12",
    location: "书桌前",
    mood: "专注",
    tags: ["学习", "AI", "产品"],
    imageTone: "cyan",
    visibility: "public",
    status: "published",
    isAiUsable: true
  },
  {
    id: "life-004",
    ownerId: OWNER_ID,
    title: "只给自己看的阶段复盘",
    excerpt: "这条记录用于展示数据隔离，不会出现在访客页，也不会被 AI 引用。",
    body: "这是私密内容示例。",
    occurredAt: "2026-03-01",
    location: "私密空间",
    mood: "复盘",
    tags: ["私密"],
    imageTone: "lime",
    visibility: "private",
    status: "draft",
    isAiUsable: false
  }
];

export const studyItems: StudyItem[] = [
  {
    id: "study-001",
    ownerId: OWNER_ID,
    type: "research_interest",
    title: "AI 应用与个人知识管理",
    summary: "关注 AI 如何帮助个人长期沉淀知识、经历和表达能力。",
    body: "我对 AI 应用层、知识库、RAG、个人数据资产和交互体验很感兴趣。这个个人网站就是把兴趣转化为真实项目的一次尝试。",
    period: "2026 - now",
    institution: "Self-directed learning",
    tags: ["AI", "RAG", "知识管理"],
    visibility: "public",
    status: "published",
    isAiUsable: true
  },
  {
    id: "study-002",
    ownerId: OWNER_ID,
    type: "course",
    title: "Web 全栈开发基础",
    summary: "学习前端页面、后端 API、数据库和部署流程。",
    body: "通过构建个人网站，我把页面设计、接口设计、数据库建模和部署流程串起来，形成一个完整的作品。",
    period: "2026",
    institution: "Project-based learning",
    tags: ["Next.js", "PostgreSQL", "Vercel"],
    visibility: "public",
    status: "published",
    isAiUsable: true
  }
];

export const workProjects: WorkProject[] = [
  {
    id: "work-001",
    ownerId: OWNER_ID,
    title: "个人 AI 数字分身网站",
    summary: "一个围绕学习、生活、工作三条主线的个人 AI 网站。",
    body: "项目包含访客端展示、管理员后台、个人知识库、访客问题沉淀、DeepSeek API 接入预留、PostgreSQL + pgvector 数据设计。它既是个人主页，也是一个能持续成长的知识系统。",
    role: "产品设计、前端实现、后端架构设计",
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "pgvector", "DeepSeek API"],
    result: "形成可运行 demo、设计文档、数据库草案和可迭代工程结构。",
    period: "2026",
    tags: ["AI", "全栈", "个人项目"],
    imageTone: "teal",
    visibility: "public",
    status: "published",
    isAiUsable: true
  },
  {
    id: "work-002",
    ownerId: OWNER_ID,
    title: "生活记录知识化系统",
    summary: "让照片和生活记录成为可检索的个人知识。",
    body: "生活记录不只是展示内容，也可以转成知识条目。访客围绕某条记录提问时，系统可以基于这条真实记录回答。",
    role: "信息架构设计",
    techStack: ["RAG", "Content Modeling", "UX"],
    result: "让生活、社交和个人表达自然进入知识库。",
    period: "2026",
    tags: ["生活记录", "知识库", "社交"],
    imageTone: "coral",
    visibility: "public",
    status: "published",
    isAiUsable: true
  }
];

export const manualKnowledge: KnowledgeItem[] = [
  {
    id: "knowledge-profile",
    ownerId: OWNER_ID,
    title: "个人基础介绍",
    category: "基础资料",
    body: `${profile.nickname} 是一个正在把学习、生活和工作认真记录下来的年轻人。这个网站用于升学、社交和求职场景，让访客更快了解他的经历、能力、兴趣和真实生活。`,
    tags: profile.tags,
    sourceType: "profile",
    visibility: "public",
    status: "published",
    isAiUsable: true
  },
  {
    id: "knowledge-boundary",
    ownerId: OWNER_ID,
    title: "AI 回答边界",
    category: "提示词规则",
    body: "虚拟的我只能基于公开且允许 AI 引用的知识回答。遇到未记录的信息，要明确说明暂时没有记录，不能编造学历、成绩、项目、私人联系方式或生活故事。",
    tags: ["AI", "安全", "边界"],
    sourceType: "manual",
    visibility: "public",
    status: "published",
    isAiUsable: true
  }
];

export const knowledgeItems: KnowledgeItem[] = [
  ...manualKnowledge,
  ...studyItems.map((item) => ({
    id: `knowledge-${item.id}`,
    ownerId: item.ownerId,
    title: item.title,
    category: "学习经历",
    body: `${item.summary}\n${item.body}`,
    tags: item.tags,
    sourceType: "study_item" as const,
    sourceId: item.id,
    visibility: item.visibility,
    status: item.status,
    isAiUsable: item.isAiUsable
  })),
  ...workProjects.map((item) => ({
    id: `knowledge-${item.id}`,
    ownerId: item.ownerId,
    title: item.title,
    category: "项目经验",
    body: `${item.summary}\n角色：${item.role}\n技术栈：${item.techStack.join("、")}\n成果：${item.result}\n${item.body}`,
    tags: item.tags,
    sourceType: "work_project" as const,
    sourceId: item.id,
    visibility: item.visibility,
    status: item.status,
    isAiUsable: item.isAiUsable
  })),
  ...lifeRecords.map((item) => ({
    id: `knowledge-${item.id}`,
    ownerId: item.ownerId,
    title: item.title,
    category: "生活记录",
    body: `${item.excerpt}\n时间：${item.occurredAt}\n地点：${item.location}\n心情：${item.mood}\n${item.body}`,
    tags: item.tags,
    sourceType: "life_record" as const,
    sourceId: item.id,
    visibility: item.visibility,
    status: item.status,
    isAiUsable: item.isAiUsable
  }))
];

