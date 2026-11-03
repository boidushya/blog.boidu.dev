"use client";

import { Handwriting } from "@/components/handwriting";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const SWEEP_START_MS = 300;
const PX_PER_MS = 0.35;
const MIN_WORD_MS = 260;
const WORD_OVERLAP_MS = 90;
const WAVE_CREST = 0.4;
const MIN_RISE_MS = 320;

// The sweep's mask is 260% wide with its soft edge between 42% and 58%, so its leading edge
// touches x (0 to 1 across the word) at progress (x + 0.092) / 1.6 and fully lights it at (x + 0.508) / 1.6.
function timeSweep(heading: HTMLElement) {
  let start = SWEEP_START_MS;
  for (const word of Array.from(heading.querySelectorAll<HTMLElement>(".sung-word"))) {
    const box = word.getBoundingClientRect();
    const duration = Math.max(MIN_WORD_MS, box.width / PX_PER_MS);
    word.style.setProperty("--sweep-start", `${Math.round(start)}ms`);
    word.style.setProperty("--sweep-duration", `${Math.round(duration)}ms`);
    const at = (progress: number) => start + duration * Math.min(1, Math.max(0, progress));
    const [base, lit] = Array.from(word.querySelectorAll(".sung-letters"), group =>
      Array.from(group.querySelectorAll<HTMLElement>(".sung-letter"))
    );
    base.forEach((letter, i) => {
      const r = letter.getBoundingClientRect();
      const touched = at(((r.left - box.left) / box.width + 0.092) / 1.6);
      const litAt = at(((r.right - box.left) / box.width + 0.508) / 1.6);
      const wave = Math.max(litAt - touched, MIN_RISE_MS) / WAVE_CREST;
      for (const el of [letter, lit[i]]) {
        el.style.setProperty("--wave-start", `${Math.round(touched)}ms`);
        el.style.setProperty("--wave-duration", `${Math.round(wave)}ms`);
      }
    });
    start += duration - WORD_OVERLAP_MS;
  }
}

export function Chapter({ n, children }: { n: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const chapter = ref.current;
    if (!chapter) return;
    let observer: IntersectionObserver | undefined;
    document.fonts.ready.then(() => {
      const heading = chapter.querySelector("h2");
      if (heading) timeSweep(heading);
      setArmed(true);
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setShown(true);
          observer?.disconnect();
        },
        { threshold: 0.8 }
      );
      observer.observe(chapter);
    });
    return () => observer?.disconnect();
  }, []);

  return (
    <div ref={ref} data-chapter={n} data-armed={armed || undefined} data-shown={shown || undefined} className="chapter">
      <div className="chapter-rule">
        <span className="sr-only">{`Chapter ${n}`}</span>
        <span aria-hidden="true" className="chapter-hand">
          <Handwriting text={`ch. ${n}`} delay={0.1} shown={shown} />
          <svg viewBox="0 0 34 26">
            <path className="chapter-stem" pathLength={1} d="M2 5 C13 2 24 6 25 21" />
            <path className="chapter-head" pathLength={1} d="M20.5 16.5 L25 21.5 L29 16" />
          </svg>
        </span>
      </div>
      {children}
    </div>
  );
}
