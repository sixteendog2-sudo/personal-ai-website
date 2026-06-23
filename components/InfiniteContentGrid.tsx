"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LifeRecordCard, StudyCard, WorkProjectCard } from "@/components/Cards";
import type { LifeRecord, StudyItem, WorkProject } from "@/lib/types";

type ContentByType = {
  life: LifeRecord;
  study: StudyItem;
  work: WorkProject;
};

type InfiniteContentGridProps<T extends keyof ContentByType> = {
  type: T;
  initialItems: ContentByType[T][];
  initialCursor: string | null;
  initialHasMore: boolean;
};

const endpoints = {
  life: "/api/public/life-records",
  study: "/api/public/study",
  work: "/api/public/work"
} as const;

const lifeFilters = ["全部", "旅行", "日常", "成长", "灵感"] as const;

export function InfiniteContentGrid<T extends keyof ContentByType>({
  type,
  initialItems,
  initialCursor,
  initialHasMore
}: InfiniteContentGridProps<T>) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lifeFilter, setLifeFilter] = useState<(typeof lifeFilters)[number]>("全部");
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingRef.current || cursor === null) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(endpoints[type] + "?limit=6&cursor=" + encodeURIComponent(cursor));
      if (!response.ok) throw new Error("Could not load more content");

      const page = await response.json() as {
        items: ContentByType[T][];
        nextCursor: string | null;
        hasMore: boolean;
      };

      setItems((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !known.has(item.id))];
      });
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      setError("加载失败，请稍后重试。");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor, hasMore, type]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { rootMargin: "320px 0px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const visibleItems = type === "life" && lifeFilter !== "全部"
    ? items.filter((item) => (item as LifeRecord).tags.includes(lifeFilter))
    : items;

  return (
    <>
      {type === "life" ? (
        <div className="chips life-filters" aria-label="筛选生活记录">
          {lifeFilters.map((filter, index) => (
            <button
              className={`chip ${index === 1 ? "cyan" : index === 2 ? "coral" : index === 3 ? "lime" : ""}`}
              key={filter}
              type="button"
              aria-pressed={lifeFilter === filter}
              onClick={() => setLifeFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      ) : null}

      <div className={type === "life" ? "feed-grid" : "grid two"} data-testid={type + "-content-grid"}>
        {visibleItems.map((item) => {
          if (type === "life") return <LifeRecordCard key={item.id} record={item as LifeRecord} />;
          if (type === "study") return <StudyCard key={item.id} item={item as StudyItem} />;
          return <WorkProjectCard key={item.id} project={item as WorkProject} />;
        })}
      </div>

      {type === "life" && visibleItems.length === 0 && !loading ? (
        <p className="load-more-state" role="status">当前分类还没有公开记录</p>
      ) : null}

      <div className="load-more-state" ref={sentinelRef} aria-live="polite" data-testid={type + "-load-state"}>
        {loading && "正在加载更多…"}
        {!loading && error && (
          <button className="button secondary" type="button" onClick={() => void loadMore()}>
            重新加载
          </button>
        )}
        {!loading && !error && !hasMore && items.length > 0 && "已经到底了"}
        {!loading && !error && items.length === 0 && "还没有公开内容"}
      </div>
    </>
  );
}
