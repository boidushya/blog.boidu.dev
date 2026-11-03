"use client";

import { useEffect } from "react";

/** Plays the post's looping videos, or holds them on their first frame when the reader prefers reduced motion. */
export function PostVideos() {
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      for (const video of Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-autoplay]"))) {
        if (reduce.matches) video.pause();
        else
          video.play().catch((error: DOMException) => {
            if (error.name !== "AbortError" && error.name !== "NotAllowedError") throw error;
          });
      }
    };
    apply();
    reduce.addEventListener("change", apply);
    return () => reduce.removeEventListener("change", apply);
  }, []);

  return null;
}
