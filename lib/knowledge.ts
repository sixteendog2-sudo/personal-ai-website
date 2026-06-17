import { knowledgeItems } from "./mock-data";
import type { Citation, KnowledgeItem, Topic } from "./types";

const topicHints: Record<Topic, string[]> = {
  default: ["基础资料", "项目经验", "学习经历", "生活记录"],
  study: ["学习经历", "研究兴趣", "课程", "升学"],
  life: ["生活记录", "兴趣爱好", "社交", "价值观"],
  work: ["项目经验", "技能能力", "工作经历", "求职"],
  admission: ["学习经历", "研究兴趣", "课程", "升学"],
  career: ["项目经验", "技能能力", "工作经历", "求职"],
  social: ["生活记录", "兴趣爱好", "社交", "价值观"]
};

function normalize(input: string) {
  return input.toLowerCase().replace(/\s+/g, "");
}

function scoreItem(item: KnowledgeItem, query: string, topic: Topic, relatedRecordId?: string) {
  const q = normalize(query);
  const text = normalize([item.title, item.category, item.body, item.tags.join("")].join(""));
  let score = 0;

  if (relatedRecordId && item.sourceId === relatedRecordId) {
    score += 12;
  }

  for (const hint of topicHints[topic] ?? []) {
    if (item.category.includes(hint) || item.tags.some((tag) => tag.includes(hint))) {
      score += 3;
    }
  }

  const keywords = ["学习", "升学", "研究", "课程", "项目", "工作", "求职", "生活", "社交", "联系", "AI", "知识库"];
  for (const keyword of keywords) {
    if (q.includes(normalize(keyword)) && text.includes(normalize(keyword))) {
      score += 4;
    }
  }

  for (const char of Array.from(q)) {
    if (char.trim() && text.includes(char)) {
      score += 0.2;
    }
  }

  if (text.includes(q)) {
    score += 8;
  }

  return score;
}

export function searchKnowledge({
  query,
  topic = "default",
  relatedRecordId,
  scope = "visitor"
}: {
  query: string;
  topic?: Topic;
  relatedRecordId?: string;
  scope?: "visitor" | "admin";
}) {
  return knowledgeItems
    .filter((item) => item.status === "published")
    .filter((item) => item.isAiUsable)
    .filter((item) => (scope === "visitor" ? item.visibility === "public" : true))
    .map((item) => ({ item, score: scoreItem(item, query, topic, relatedRecordId) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ item }) => item);
}

export function toCitations(items: KnowledgeItem[]): Citation[] {
  return items.map((item) => ({
    sourceType: item.sourceType,
    sourceId: item.sourceId,
    title: item.title,
    category: item.category
  }));
}

export function buildKnowledgeContext(items: KnowledgeItem[]) {
  return items
    .map((item, index) => {
      return `[${index + 1}] ${item.title} / ${item.category}\n${item.body}`;
    })
    .join("\n\n");
}

