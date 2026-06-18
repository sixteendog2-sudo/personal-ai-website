import { NextResponse } from "next/server";
import { profile as fallbackProfile } from "@/lib/mock-data";
import { listLifeRecords, listStudyItems, listWorkProjects } from "@/lib/content-store";
import { getOwnerProfile } from "@/lib/settings-store";

export async function GET() {
  const [lifeRecords, studyItems, workProjects, storedProfile] = await Promise.all([listLifeRecords(), listStudyItems(), listWorkProjects(), getOwnerProfile()]);
  const profile = storedProfile?.visibility === "public" ? {
    ownerId: storedProfile.ownerId, nickname: storedProfile.nickname, realName: storedProfile.realName ?? "",
    headline: storedProfile.headline, bio: storedProfile.bio, city: storedProfile.city,
    contact: storedProfile.contact as { email: string; github: string; wechat: string }, tags: storedProfile.tags,
    visibility: storedProfile.visibility, status: "published" as const, isAiUsable: storedProfile.isAiUsable
  } : storedProfile ? null : fallbackProfile;
  return NextResponse.json({
    profile,
    lifeRecords,
    studyItems,
    workProjects,
    suggestedQuestions: ["你是谁？", "介绍一下你的项目经历", "你适合什么研究方向？", "平时有什么兴趣？"]
  });
}
