"use client";

import { boidoodleNova, caveat } from "@/utils/fonts";
import { motion, useReducedMotion } from "motion/react";
import React, { createContext, useContext, useLayoutEffect, useRef, useState } from "react";

const SECONDS_PER_PX = 0.003;
const LINE_PAUSE = 0.12;
const INK_MASK = "linear-gradient(90deg, #000 0 42%, transparent 58% 100%)";

type WordTiming = { delay: number; duration: number };

// One soft edge travels each line at a steady pace. A word's mask is 260% of its width with the
// edge at its middle, so the edge crosses the word from -0.3 to 1.3 of its width over the sweep.
function timeWords(words: HTMLElement[], delay: number): WordTiming[] {
  const lines = new Map<number, HTMLElement[]>();
  for (const word of words) lines.set(word.offsetTop, [...(lines.get(word.offsetTop) ?? []), word]);
  const timings: WordTiming[] = [];
  let lineStart = delay;
  for (const line of Array.from(lines.values())) {
    const left = Math.min(...line.map(w => w.offsetLeft));
    const right = Math.max(...line.map(w => w.offsetLeft + w.offsetWidth));
    for (const word of line) {
      const width = word.offsetWidth;
      timings.push({
        delay: lineStart + (word.offsetLeft - left - 0.3 * width) * SECONDS_PER_PX,
        duration: 1.6 * width * SECONDS_PER_PX,
      });
    }
    lineStart += (right - left) * SECONDS_PER_PX + LINE_PAUSE;
  }
  return timings;
}

const Hand = createContext(boidoodleNova.className);

/** Writes every `Handwriting` inside it in a guest's hand (Caveat), for a guest's own words; boidoodle nova is the author's. */
export function GuestHand({ children }: { children: React.ReactNode }) {
  return <Hand value={caveat.className}>{children}</Hand>;
}

/**
 * Text that writes itself in like a pen. Pass `shown` to drive it directly, or leave it out to
 * follow the "hidden" and "shown" variants of a motion parent.
 */
export function Handwriting({
  text,
  delay = 0,
  shown,
  className = "",
  inkEndOn,
}: {
  text: string;
  delay?: number;
  shown?: boolean;
  className?: string;
  inkEndOn?: React.RefObject<HTMLElement | null>;
}) {
  const reduceMotion = useReducedMotion();
  const hand = useContext(Hand);
  const words = text.split(" ");
  const wordRefs = useRef<HTMLSpanElement[]>([]);
  const [timings, setTimings] = useState<WordTiming[]>([]);
  const inkEndRef = useRef(inkEndOn);
  inkEndRef.current = inkEndOn;

  useLayoutEffect(() => {
    const measure = () => {
      const next = timeWords(wordRefs.current.slice(0, words.length), delay);
      setTimings(next);
      const end = Math.max(delay, ...next.map(t => t.delay + t.duration));
      inkEndRef.current?.current?.style.setProperty("--ink-end", `${Math.round(end * 1000)}ms`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (wordRefs.current[0]?.parentElement) observer.observe(wordRefs.current[0].parentElement);
    return () => observer.disconnect();
  }, [words.length, delay]);

  const driven = shown !== undefined && {
    initial: reduceMotion ? false : ("hidden" as const),
    animate: reduceMotion || (shown && timings.length > 0) ? "shown" : "hidden",
  };

  return (
    <motion.span className={`${hand} select-none ${className}`} {...driven}>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          {i > 0 && " "}
          <motion.span
            ref={el => {
              if (el) wordRefs.current[i] = el;
            }}
            className="inline-block px-[0.25em] -mx-[0.25em] py-[0.3em] -my-[0.3em]"
            style={{ maskImage: INK_MASK, maskSize: "260% 100%", maskRepeat: "no-repeat" }}
            variants={{ hidden: { maskPosition: "100% 0%" }, shown: { maskPosition: "0% 0%" } }}
            transition={{ ease: "linear", ...(timings[i] ?? { delay, duration: 0.2 }) }}
          >
            {word}
          </motion.span>
        </React.Fragment>
      ))}
    </motion.span>
  );
}
