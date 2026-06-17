export type Visibility = "public" | "unlisted" | "private";
export type PublishStatus = "draft" | "published" | "archived";
export type SourceType =
  | "manual"
  | "profile"
  | "study_item"
  | "work_project"
  | "life_record"
  | "visitor_question"
  | "chat_summary";

export type Topic = "default" | "study" | "life" | "work" | "admission" | "career" | "social";

export interface GovernedContent {
  ownerId: string;
  visibility: Visibility;
  status: PublishStatus;
  isAiUsable: boolean;
  tags: string[];
}

export interface Profile extends GovernedContent {
  nickname: string;
  realName: string;
  headline: string;
  bio: string;
  city: string;
  contact: {
    email: string;
    github: string;
    wechat: string;
  };
}

export interface LifeRecord extends GovernedContent {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  occurredAt: string;
  location: string;
  mood: string;
  imageTone: string;
}

export interface StudyItem extends GovernedContent {
  id: string;
  type: string;
  title: string;
  summary: string;
  body: string;
  period: string;
  institution: string;
}

export interface WorkProject extends GovernedContent {
  id: string;
  title: string;
  summary: string;
  body: string;
  role: string;
  techStack: string[];
  result: string;
  period: string;
  imageTone: string;
}

export interface KnowledgeItem extends GovernedContent {
  id: string;
  title: string;
  category: string;
  body: string;
  sourceType: SourceType;
  sourceId?: string;
}

export interface Citation {
  sourceType: SourceType;
  sourceId?: string;
  title: string;
  category: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  visitorId: string;
  topic: Topic;
  entry: string;
  relatedRecordId?: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface VisitorQuestion {
  id: string;
  question: string;
  answer: string;
  topic: Topic;
  status: "new" | "valuable" | "converted" | "ignored";
  citations: Citation[];
  createdAt: string;
}

