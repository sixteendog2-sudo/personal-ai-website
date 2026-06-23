"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ContentImage } from "@/lib/types";

export function ImageCarousel({
  images,
  title,
  href,
  tone = "",
  detail = false
}: {
  images: ContentImage[];
  title: string;
  href?: string;
  tone?: string;
  detail?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null) return;

    function close(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
    }

    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [lightbox]);

  function goTo(index: number) {
    if (!images.length) return;
    const next = (index + images.length) % images.length;
    setActive(next);
    viewportRef.current?.scrollTo({ left: next * viewportRef.current.clientWidth, behavior: "smooth" });
  }

  if (!images.length) {
    return (
      <div className={`photo media-carousel-empty ${tone}`}>
        <Images size={28} aria-hidden="true" />
        <span>暂无图片</span>
      </div>
    );
  }

  return (
    <>
      <div className={`media-carousel ${detail ? "detail" : "compact"}`}>
        <div
          className="media-carousel-viewport"
          ref={viewportRef}
          onScroll={(event) => {
            const width = event.currentTarget.clientWidth;
            if (width) setActive(Math.round(event.currentTarget.scrollLeft / width));
          }}
        >
          {images.map((image, index) => {
            const picture = (
              <img
                className="media-carousel-image"
                src={image.url}
                alt={image.alt || `${title} 第 ${index + 1} 张图片`}
              />
            );

            return (
              <div className="media-carousel-slide" key={`${image.url}-${index}`}>
                {href ? (
                  <Link href={href} aria-label={`${title}，查看详情`}>
                    {picture}
                  </Link>
                ) : detail ? (
                  <button type="button" onClick={() => setLightbox(index)} aria-label={`放大查看第 ${index + 1} 张图片`}>
                    {picture}
                  </button>
                ) : (
                  picture
                )}
              </div>
            );
          })}
        </div>

        {images.length > 1 ? (
          <>
            <button className="carousel-arrow previous" type="button" onClick={() => goTo(active - 1)} aria-label="上一张图片">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button className="carousel-arrow next" type="button" onClick={() => goTo(active + 1)} aria-label="下一张图片">
              <ChevronRight aria-hidden="true" />
            </button>
            <div className="carousel-dots" aria-label={`共 ${images.length} 张图片`}>
              {images.map((_, index) => (
                <button
                  className={index === active ? "active" : ""}
                  type="button"
                  aria-label={`查看第 ${index + 1} 张图片`}
                  onClick={() => goTo(index)}
                  key={index}
                />
              ))}
            </div>
            <span className="carousel-counter">{active + 1} / {images.length}</span>
          </>
        ) : null}
      </div>

      {lightbox !== null ? (
        <div className="media-lightbox" role="dialog" aria-modal="true" aria-label={`${title} 图片预览`}>
          <button className="lightbox-close" type="button" onClick={() => setLightbox(null)} aria-label="关闭图片预览">
            <X aria-hidden="true" />
          </button>
          <button
            className="lightbox-arrow previous"
            type="button"
            onClick={() => setLightbox((lightbox - 1 + images.length) % images.length)}
            aria-label="上一张图片"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <img src={images[lightbox].url} alt={images[lightbox].alt || title} />
          <button
            className="lightbox-arrow next"
            type="button"
            onClick={() => setLightbox((lightbox + 1) % images.length)}
            aria-label="下一张图片"
          >
            <ChevronRight aria-hidden="true" />
          </button>
          <span>{lightbox + 1} / {images.length}</span>
        </div>
      ) : null}
    </>
  );
}
