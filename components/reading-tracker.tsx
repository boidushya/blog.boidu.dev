"use client";

import { clamp01 } from "@/utils/math";
import { recordProgress } from "@/utils/reading-progress";
import { useEffect } from "react";

export function ReadingTracker({ id }: { id: string }) {
  useEffect(() => {
    const article = document.querySelector<HTMLElement>("article.blog");
    if (!article) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const { top, height } = article.getBoundingClientRect();
      recordProgress(id, clamp01((window.innerHeight - top) / height));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [id]);

  return null;
}
