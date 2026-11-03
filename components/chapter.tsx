"use client";

import { Handwriting } from "@/components/handwriting";
import { observeReveal } from "@/utils/reveal";
import { playWalkNote, walkMelody } from "@/utils/sounds";
import { timeSweep } from "@/utils/sweep";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const CHAPTER_SWEEP = { pxPerMs: 0.35, minWordMs: 260, overlapMs: 90, startMs: 300 };

export function Chapter({ n, children }: { n: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const chapter = ref.current;
    if (!chapter) return;
    let stopObserving: (() => void) | undefined;
    const notes: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const heading = chapter.querySelector("h2");
      const words = heading ? timeSweep(heading, CHAPTER_SWEEP) : [];
      setArmed(true);
      stopObserving = observeReveal(chapter, 0.8, quiet => {
        setShown(true);
        if (quiet || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const melody = walkMelody(words.map(word => word.letters));
        words.forEach((word, i) => notes.push(setTimeout(() => playWalkNote(melody[i]), word.startMs)));
      });
    });
    return () => {
      cancelled = true;
      stopObserving?.();
      notes.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} data-chapter={n} data-armed={armed || undefined} data-shown={shown || undefined} className="chapter">
      <div className="chapter-rule">
        <span className="sr-only">{`Chapter ${n}`}</span>
        <span aria-hidden="true" className="chapter-hand">
          <Handwriting
            text={`ch. ${n}`}
            delay={0.1}
            shown={shown}
            onTimed={end => ref.current?.style.setProperty("--ink-end", `${Math.round(end * 1000)}ms`)}
          />
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
