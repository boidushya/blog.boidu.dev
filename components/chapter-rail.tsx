"use client";

import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CHAPTER_SCROLL_OFFSET = 96;

// Lazy media above the target can grow mid-scroll, so re-aim until it lands.
function scrollToChapter(el: HTMLElement, behavior: ScrollBehavior, attempts = 3) {
  const offset = () => el.getBoundingClientRect().top - CHAPTER_SCROLL_OFFSET;
  window.scrollTo({ top: window.scrollY + offset(), behavior });
  if (attempts <= 1) return;
  window.addEventListener(
    "scrollend",
    () => {
      if (Math.abs(offset()) > 2) scrollToChapter(el, behavior, attempts - 1);
    },
    { once: true }
  );
}

type ChapterEntry = { id: string; n: string; title: string; el: HTMLElement };

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

    const items = Array.from(list.children) as HTMLElement[];
    const anchor = (i: number) => items[i].offsetTop + items[i].offsetHeight / 2;
    const from = anchor(current);
    const to = current + 1 < items.length ? anchor(current + 1) : list.offsetHeight;
    const chapterEnd = tops[current + 1] ?? bodyRect.bottom;
    const within = Math.min(1, Math.max(0, (readingLine - tops[current]) / (chapterEnd - tops[current])));
    progress.set((from + within * (to - from)) / list.offsetHeight);
  }, [chapters, progress]);

  useEffect(update, [update]);
  useMotionValueEvent(scrollY, "change", update);

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
              className="relative"
            >
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-accent-800" />
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-px origin-top bg-accent-400"
                style={{ scaleY: reduceMotion ? progress : smoothProgress }}
              />
              <ol ref={listRef}>
                {chapters.map((chapter, i) => (
                  <li key={chapter.id}>
                    <a
                      href={`#${chapter.id}`}
                      aria-current={i === active ? "location" : undefined}
                      onClick={event => {
                        event.preventDefault();
                        history.replaceState(null, "", `#${chapter.id}`);
                        scrollToChapter(chapter.el, reduceMotion ? "auto" : "smooth");
                      }}
                      className={`flex gap-3 py-2 pl-5 text-sm leading-snug transition-colors ${
                        i === active ? "text-accent-50" : "text-fg-subtle hover:text-fg-muted"
                      }`}
                    >
                      <span className="tabular-nums text-fg-faint">{chapter.n}</span>
                      {chapter.title}
                    </a>
                  </li>
                ))}
              </ol>
            </motion.nav>
          </div>,
          document.body
        )}
    </div>
  );
}
