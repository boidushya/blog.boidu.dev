"use client";

import { boidoodleNova } from "@/utils/fonts";
import { clamp01 } from "@/utils/math";
import { endJump, startJump } from "@/utils/reveal";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CHAPTER_SCROLL_OFFSET = 96;

// Lazy media above the target can grow mid-scroll, so re-aim until it lands.
function scrollToChapter(el: HTMLElement, behavior: ScrollBehavior, attempts = 3) {
  const offset = () => el.getBoundingClientRect().top - CHAPTER_SCROLL_OFFSET;
  if (Math.abs(offset()) <= 2) return endJump();
  startJump();
  window.scrollTo({ top: window.scrollY + offset(), behavior });
  window.addEventListener(
    "scrollend",
    () => {
      if (attempts > 1 && Math.abs(offset()) > 2) scrollToChapter(el, behavior, attempts - 1);
      else endJump();
    },
    { once: true }
  );
}

type ChapterEntry = { id: string; n: string; title: string; el: HTMLElement; tint?: string };

export function ChapterRail({ children }: { children: React.ReactNode }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [chapters, setChapters] = useState<ChapterEntry[]>([]);
  const [active, setActive] = useState(-1);
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, { stiffness: 420, damping: 42, mass: 0.6 });
  const { scrollY } = useScroll();
  const fillClip = useTransform(
    reduceMotion ? progress : smoothProgress,
    p => `inset(0 0 ${(1 - p) * 100}% 0 round 3px)`
  );

  useEffect(() => {
    const els = Array.from(bodyRef.current?.querySelectorAll<HTMLElement>("[data-chapter]") ?? []);
    setChapters(
      els.flatMap(el => {
        const heading = el.querySelector("h2");
        if (!heading) return [];
        return [
          {
            id: heading.id,
            n: el.dataset.chapter ?? "",
            title: heading.dataset.title ?? heading.textContent ?? "",
            el,
            // An unnumbered chapter (a foreword) takes its writer's byline colour as its marker.
            tint: el.closest(".foreword")?.querySelector<HTMLElement>(".byline-avatar")?.style.background,
          },
        ];
      })
    );
  }, []);

  const update = useCallback(() => {
    const body = bodyRef.current;
    const list = listRef.current;
    if (!body || !list || chapters.length === 0) return;

    const readingLine = window.innerHeight / 2;
    const bodyRect = body.getBoundingClientRect();
    setVisible(bodyRect.top < readingLine && bodyRect.bottom > readingLine);

    const tops = chapters.map(c => c.el.getBoundingClientRect().top);
    const current = tops.findLastIndex(top => top < readingLine);
    setActive(current);
    if (current < 0) return progress.set(0);

    const markers = Array.from(list.querySelectorAll<HTMLElement>("[data-marker]"));
    const anchor = (i: number) => markers[i].offsetTop + markers[i].offsetHeight;
    const from = anchor(current);
    const to = current + 1 < markers.length ? anchor(current + 1) : list.offsetHeight;
    const chapterEnd = tops[current + 1] ?? bodyRect.bottom;
    const within = clamp01((readingLine - tops[current]) / (chapterEnd - tops[current]));
    progress.set((from + within * (to - from)) / list.offsetHeight);
  }, [chapters, progress]);

  useEffect(update, [update]);
  useMotionValueEvent(scrollY, "change", update);

  const entries = (lit: boolean) =>
    chapters.map((chapter, i) => (
      <li key={chapter.id}>
        <a
          href={`#${chapter.id}`}
          aria-current={!lit && i === active ? "location" : undefined}
          data-cuelume-navigate={lit ? undefined : true}
          data-cuelume-emphasis={lit ? undefined : "subtle"}
          onClick={event => {
            event.preventDefault();
            history.replaceState(null, "", `#${chapter.id}`);
            scrollToChapter(chapter.el, reduceMotion ? "auto" : "smooth");
          }}
          className={`flex items-baseline gap-3 py-2 text-sm leading-snug transition-colors ${
            i === active ? "text-accent-50" : "text-fg-subtle hover:text-fg-muted"
          }`}
        >
          <span data-marker className={chapter.n ? "chapter-marker" : "chapter-marker self-start items-center h-[1lh]"}>
            {chapter.n ? (
              <span className={`chapter-digit ${boidoodleNova.className}`}>{chapter.n}</span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-fg-faint" style={{ background: chapter.tint }} />
            )}
          </span>
          {chapter.title}
        </a>
      </li>
    ));

  return (
    <div ref={bodyRef}>
      {children}
      {chapters.length > 0 &&
        createPortal(
          <div className="fixed hidden -translate-y-1/2 xl:block top-1/2 left-[calc(50%-38rem)] w-44">
            <motion.nav
              aria-label="Chapters"
              inert={!visible}
              initial={false}
              animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: reduceMotion ? 0 : -8 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="chapter-rail"
            >
              <span aria-hidden="true" className="chapter-track" />
              <motion.span aria-hidden="true" className="chapter-track chapter-fill" style={{ clipPath: fillClip }} />
              <ol ref={listRef}>{entries(false)}</ol>
              <motion.ol aria-hidden="true" inert className="chapter-lit" style={{ clipPath: fillClip }}>
                {entries(true)}
              </motion.ol>
            </motion.nav>
          </div>,
          document.body
        )}
    </div>
  );
}
