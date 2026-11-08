"use client";

import { clamp01 } from "@/utils/math";
import { recordProgress, takeResume } from "@/utils/reading-progress";
import { useEffect, useRef } from "react";

const RELEASE_ON = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

export function ReadingTracker({ id }: { id: string }) {
  // Kept on a ref because the intent is consumed once and a remounted effect must still hold the spot.
  const resume = useRef<{ id: string; at?: number }>(undefined);

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
    if (resume.current?.id !== id) resume.current = { id, at: takeResume(id) };
    const spot = resume.current;
    // Images above the spot load after the jump and push it away, so the spot is held until the reader moves.
    const holder = new ResizeObserver(() => {
      const { top, height } = article.getBoundingClientRect();
      window.scrollTo({
        top: top + window.scrollY - window.innerHeight + (spot.at ?? 0) * height,
        behavior: "instant",
      });
    });
    const release = () => holder.disconnect();
    const settle = () => {
      spot.at = undefined;
      release();
    };
    if (spot.at !== undefined) {
      holder.observe(article);
      for (const type of RELEASE_ON) window.addEventListener(type, settle, { once: true, passive: true });
    }
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      release();
      for (const type of RELEASE_ON) window.removeEventListener(type, settle);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [id]);

  return null;
}
