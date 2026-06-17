import { buildKnowledgeContext, searchKnowledge, toCitations } from "./knowledge";
import type { ChatMessage, Citation, Topic } from "./types";

const sceneLabel: Record<Topic, string> = {
  default: "综合介绍",
  study: "学习成长",
  life: "生活记录",
  work: "工作项目",
  admission: "升学咨询",
  career: "求职咨询",
  social: "社交破冰"
};

function systemPrompt() {
  return [
    "你是站点主人的 AI 分身助手。",
    "你必须根据提供的个人知识库内容回答。",
    "如果知识库没有相关信息，请明确说明暂时没有记录。",
    "不要编造主人的身份、学历、经历、项目、观点或生活故事。",
    "涉及隐私内容时拒绝回答。",
    "回答语气自然、真诚、简洁，像主人本人在做温和的自我介绍。"
  ].join("\n");
}

function localAnswer(question: string, citations: Citation[], topic: Topic) {
  if (citations.length === 0) {
    return "我目前的公开知识库里还没有这方面记录，所以不能替他编造。你可以换个角度问我，或者通过联系页直接联系本人。";
  }

  const sourceLine = citations.map((citation) => `《${citation.title}》`).join("、");
  const topicText = sceneLabel[topic] ?? "个人介绍";

  if (topic === "work" || topic === "career") {
    return `可以。从目前公开的项目记录看，他正在把这个个人网站做成一个完整的 AI 产品：包含前台展示、管理员后台、个人知识库、访客问题沉淀和 DeepSeek 接入预留。这个项目能体现他的产品思考、前后端整合能力和对数据沉淀的重视。参考来源：${sourceLine}。`;
  }

  if (topic === "study" || topic === "admission") {
    return `关于学习方向，他目前比较关注 AI 应用、个人知识管理、RAG 和 Web 全栈开发。他更偏向用真实项目来验证学习成果，而不是只停留在概念层面。参考来源：${sourceLine}。`;
  }

  if (topic === "life" || topic === "social") {
    return `从生活记录看，他希望别人看到的不只是简历里的能力，也包括真实的日常、兴趣和观察。他会把一些照片、想法和生活片段整理成记录，让社交交流更自然。参考来源：${sourceLine}。`;
  }

  return `我可以基于公开知识库回答这个问题。就“${question}”来看，当前最相关的是 ${topicText} 相关内容，尤其是 ${sourceLine}。总体来说，这个网站希望把学习、生活和工作放在同一个成长档案里，帮助别人更快、更真实地了解他。`;
}

export async function generateAiAnswer({
  message,
  topic = "default",
  relatedRecordId,
  history = []
}: {
  message: string;
  topic?: Topic;
  relatedRecordId?: string;
  history?: ChatMessage[];
}) {
  const retrieved = searchKnowledge({
    query: message,
    topic,
    relatedRecordId,
    scope: "visitor"
  });
  const citations = toCitations(retrieved);
  const knowledgeContext = buildKnowledgeContext(retrieved);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_CHAT_MODEL ?? "deepseek-v4-flash";

  if (!apiKey) {
    return {
      answer: localAnswer(message, citations, topic),
      citations,
      provider: "local-demo",
      model: "mock-rag"
    };
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt() },
          {
            role: "user",
            content: [
              `场景：${sceneLabel[topic]}`,
              `知识库内容：\n${knowledgeContext || "无相关公开知识"}`,
              `最近对话：\n${history.slice(-6).map((item) => `${item.role}: ${item.content}`).join("\n")}`,
              `访客问题：${message}`
            ].join("\n\n")
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      answer: payload.choices?.[0]?.message?.content ?? localAnswer(message, citations, topic),
      citations,
      provider: "deepseek",
      model
    };
  } catch (error) {
    return {
      answer: `${localAnswer(message, citations, topic)}\n\n提示：真实模型调用暂时失败，demo 已使用本地知识库回答。`,
      citations,
      provider: "local-demo",
      model: "mock-rag",
      error: error instanceof Error ? error.message : "unknown error"
    };
  }
}

