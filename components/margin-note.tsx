"use client";

import { handwriting } from "@/utils/fonts";
import { motion, useReducedMotion } from "motion/react";
import React, { useLayoutEffect, useRef, useState } from "react";

const BRACKET_PATH = "M2 2.5 C5 1.8 8 1.6 10.5 2 C10.2 30 10.9 70 10.4 98 C7.5 98.6 4.5 98.4 1.5 98.9";
const NOTE_DELAY = 0.45;
const SECONDS_PER_PX = 0.0035;
const LINE_PAUSE = 0.12;
const INK_MASK = "linear-gradient(90deg, #000 0 42%, transparent 58% 100%)";

type WordTiming = { delay: number; duration: number };

// One soft edge travels each line at a steady pace. A word's mask is 260% of its width with the
// edge at its middle, so the edge crosses the word from -0.3 to 1.3 of its width over the sweep.
function timeWords(words: HTMLElement[]): WordTiming[] {
  const lines = new Map<number, HTMLElement[]>();
  for (const word of words) lines.set(word.offsetTop, [...(lines.get(word.offsetTop) ?? []), word]);
  const timings: WordTiming[] = [];
  let lineStart = NOTE_DELAY;
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

export function MarginNote({ note, children }: { note: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const draw = !reduceMotion;
  const words = note.split(" ");
  const wordRefs = useRef<HTMLSpanElement[]>([]);
  const [timings, setTimings] = useState<WordTiming[]>([]);

  useLayoutEffect(() => {
    const measure = () => setTimings(timeWords(wordRefs.current.slice(0, words.length)));
    measure();
    const observer = new ResizeObserver(measure);
    if (wordRefs.current[0]?.parentElement) observer.observe(wordRefs.current[0].parentElement);
    return () => observer.disconnect();
  }, [words.length]);

  return (
    <motion.div
      className="relative"
      initial={draw ? "hidden" : false}
      whileInView="shown"
      viewport={{ once: true, amount: 0.6 }}
    >
      {children}
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 12 100"
        preserveAspectRatio="none"
        className="absolute top-0 bottom-0 hidden w-3 h-full xl:block left-[calc(100%+1.25rem)] text-accent-400"
        fill="none"
        variants={{ hidden: { clipPath: "inset(0 0 100% 0)" }, shown: { clipPath: "inset(0 0 0% 0)" } }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <path
          d={BRACKET_PATH}
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.svg>
      <span
        className={`${handwriting.className} block -mt-3 mb-6 text-right text-2xl leading-none text-accent-400 -rotate-2 xl:absolute xl:m-0 xl:top-1/2 xl:-translate-y-1/2 xl:left-[calc(100%+3rem)] xl:w-44 xl:text-left`}
      >
        {words.map((word, i) => (
          <React.Fragment key={`${word}-${i}`}>
            {i > 0 && " "}
            <motion.span
              ref={el => {
                if (el) wordRefs.current[i] = el;
              }}
              className="inline-block px-[0.25em] -mx-[0.25em] py-[0.3em] -my-[0.3em]"
              style={{
                maskImage: INK_MASK,
                maskSize: "260% 100%",
                maskRepeat: "no-repeat",
              }}
              variants={{
                hidden: { maskPosition: "100% 0%" },
                shown: { maskPosition: "0% 0%" },
              }}
              transition={{ ease: "linear", ...(timings[i] ?? { delay: NOTE_DELAY, duration: 0.2 }) }}
            >
              {word}
            </motion.span>
          </React.Fragment>
        ))}
      </span>
    </motion.div>
  );
}
