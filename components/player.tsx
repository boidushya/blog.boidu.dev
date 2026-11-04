"use client";

import { PipLine } from "@/components/pip-line";
import { NextIcon, PlayIcon, PreviousIcon } from "@/components/player-icons";
import { ProgressBar } from "@/components/progress-bar";
import { SungTitle } from "@/components/sung-title";
import { useWash } from "@/components/wash";
import type { BlogCard } from "@/lib/blogs";
import { NEUTRAL_COLORS } from "@/utils/constants";
import { handwriting } from "@/utils/fonts";
import { useResizeObserver, useWaterMark } from "@/utils/hooks";
import { matchesSearch, usePostSearch } from "@/utils/post-search";
import { clock, getProgress, pickShuffle } from "@/utils/reading-progress";
import { retrigger } from "@/utils/retrigger";
import { timeSweep } from "@/utils/sweep";
import { getPaletteVariables } from "@/utils/themeConfig";
import { isTypingTarget } from "@/utils/typing";
import { play } from "cuelume";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const PLAYER_SWEEP = { pxPerMs: 0.6, minWordMs: 210, overlapMs: 75, startMs: 60 };
const PHONE_MAX_PX = 860;
const HOVER_MS = 90;
const WHEEL_STEP_PX = 90;
const WHEEL_IDLE_MS = 220;
const NOTE_FADE_MS = 130;
const COPIED_MS = 1600;
const KEY_STEPS = new Map([
  ["ArrowDown", 1],
  ["ArrowUp", -1],
  ["PageDown", 5],
  ["PageUp", -5],
  ["Home", Number.NEGATIVE_INFINITY],
  ["End", Number.POSITIVE_INFINITY],
]);

type Timer = ReturnType<typeof setTimeout> | undefined;
type NoteSide = "right" | "below" | "below-left" | "above";

const cssVars = (vars: Record<`--${string}`, string | number>): CSSProperties => vars;

const linesIn = (list: HTMLElement | null) => Array.from(list?.querySelectorAll<HTMLElement>(".player-line") ?? []);

const isDesktop = () => innerWidth > PHONE_MAX_PX;

function falloff(distance: number) {
  const opacity = 1 - distance * 0.1 - distance * distance * 0.02;
  return {
    opacity: Math.max(0, opacity),
    blur: opacity > 0.15 ? distance + distance * distance * 0.125 : 0,
    hidden: opacity <= 0,
  };
}

function fitTitle(heading: HTMLElement) {
  const widest = () => Math.max(...Array.from(heading.querySelectorAll<HTMLElement>(".sung-word"), w => w.offsetWidth));
  let size = Number.parseFloat(getComputedStyle(heading).fontSize);
  while (widest() > heading.clientWidth && size > 20) {
    size -= 2;
    heading.style.fontSize = `${size}px`;
  }
}

function tipIn(side: NoteSide, inkWidth: number): [number, number] {
  if (side === "right") {
    const r = (-35 * Math.PI) / 180;
    const dx = -24;
    const dy = -17;
    return [30 + dx * Math.cos(r) - dy * Math.sin(r), 22 + dx * Math.sin(r) + dy * Math.cos(r)];
  }
  if (side === "below-left") return [inkWidth + 28, 5];
  if (side === "above") return [6, 39];
  return [6, 5];
}

function placeNote(
  line: HTMLElement,
  lyrics: HTMLElement,
  scroller: HTMLElement,
  scrollOffset: number,
  note: HTMLElement,
  ink: HTMLElement
) {
  const words = Array.from(line.querySelectorAll<HTMLElement>(".sung-word"));
  const width = scroller.clientWidth;
  const lineTop = line.offsetTop;
  const lineCentre = lineTop + scrollOffset + scroller.offsetTop;
  const last = words[words.length - 1];
  const inkWidth = ink.offsetWidth;
  const wide = inkWidth + 34;
  const narrow = inkWidth + 8;
  const wordRight = last.offsetLeft + last.offsetWidth;
  const wordTop = lineTop + last.offsetTop;
  const wordBottom = wordTop + last.offsetHeight;
  const low = lineCentre + line.offsetHeight / 2 > lyrics.clientHeight * 0.6 && lyrics.clientHeight < innerHeight * 1.5;

  const fits = (side: NoteSide, x: number) => {
    const left = x - tipIn(side, inkWidth)[0];
    return left >= 0 && left + (side === "below-left" ? narrow : wide) <= width;
  };
  const anchorIn = (row: HTMLElement[], side: NoteSide) =>
    row
      .slice()
      .reverse()
      .find(w => fits(side, w.offsetLeft + w.offsetWidth + 6)) ?? row[0];

  const spot = (): [NoteSide, number, number] => {
    if (fits("right", wordRight + 18)) return ["right", wordRight + 18, wordTop + last.offsetHeight * 0.58];
    if (low) {
      const anchor = anchorIn(
        words.filter(w => Math.abs(w.offsetTop - words[0].offsetTop) < 4),
        "above"
      );
      return ["above", anchor.offsetLeft + anchor.offsetWidth + 6, lineTop + anchor.offsetTop + 2];
    }
    if (fits("below", wordRight + 6)) return ["below", wordRight + 6, wordBottom - 2];
    if (fits("below-left", wordRight + 6)) return ["below-left", wordRight + 6, wordBottom - 2];
    const anchor = anchorIn(
      words.filter(w => Math.abs(w.offsetTop - last.offsetTop) < 4),
      "below"
    );
    return ["below", anchor.offsetLeft + anchor.offsetWidth + 6, lineTop + anchor.offsetTop + anchor.offsetHeight - 2];
  };

  const [side, tx, ty] = spot();
  const [ox, oy] = tipIn(side, inkWidth);
  note.dataset.side = side;
  note.style.translate = `${tx - ox}px ${ty - oy}px`;
}

function ripple(button: HTMLElement, layer: HTMLElement, e: MouseEvent) {
  const r = button.getBoundingClientRect();
  const size = r.width;
  const x = e.clientX > 0 ? e.clientX - r.left : size / 2;
  const y = e.clientY > 0 ? e.clientY - r.top : size / 2;
  const wave = document.createElement("span");
  wave.className = "player-ripple";
  Object.assign(wave.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x - size / 2}px`,
    top: `${y - size / 2}px`,
  });
  layer.appendChild(wave);
  requestAnimationFrame(() => wave.classList.add("player-ripple--go"));
  setTimeout(() => wave.remove(), 520);
}

function Control({
  label,
  disabled,
  nudge,
  onPress,
  className = "",
  children,
  ...rest
}: Omit<ComponentPropsWithoutRef<"button">, "onClick"> & {
  label: string;
  disabled: boolean;
  nudge?: "prev" | "next";
  onPress: () => void;
}) {
  const layer = useRef<HTMLSpanElement>(null);

  return (
    <button
      type="button"
      className={`player-btn ${className}`}
      aria-label={label}
      aria-disabled={disabled}
      onClick={e => {
        const button = e.currentTarget;
        if (disabled) {
          if (nudge) retrigger(button, `player-wall-${nudge}`, 380);
          return;
        }
        if (layer.current) ripple(button, layer.current, e);
        if (nudge) retrigger(button, `player-nudge-${nudge}`, 320);
        retrigger(button, "control-pop", 320);
        onPress();
      }}
      {...rest}
    >
      <span ref={layer} className="player-ripple-layer" aria-hidden="true" />
      {children}
    </button>
  );
}

export function Player({ posts }: { posts: BlogCard[] }) {
  useWaterMark();
  const router = useRouter();
  const query = usePostSearch();
  const matches = useMemo(() => posts.filter(post => matchesSearch(post, query)), [posts, query]);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(matches);
  if (matches.length !== visible.length || matches.some((post, i) => post !== visible[i])) {
    setVisible(matches);
    setIndex(0);
  }

  const current = visible[index];
  const [held, setHeld] = useState(posts[0]);
  if (current && current !== held) setHeld(current);
  const active = current ?? held;
  const empty = visible.length === 0;

  const [progress, setProgress] = useState<Record<string, number> | null>(null);
  const [timesReady, setTimesReady] = useState(false);
  const [measured, setMeasured] = useState<BlogCard[] | null>(null);
  const [copied, setCopied] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0);
  const followFocus = useRef(false);
  const committedIndex = useRef(0);
  const focusingLine = useRef(false);
  const pointer = useRef({ x: -1, y: -1 });
  const hoverTimer = useRef<Timer>(undefined);
  const drawTimer = useRef<Timer>(undefined);
  const copyTimer = useRef<Timer>(undefined);
  const scrollOffset = useRef(0);
  const lyricsWidth = useRef(-1);

  const centre = useCallback((i: number) => {
    const line = linesIn(listRef.current)[i];
    const scroller = scrollerRef.current;
    if (!line || !scroller) return;
    scrollOffset.current = isDesktop() ? -line.offsetTop - line.offsetHeight / 2 : 0;
    if (isDesktop()) scroller.style.translate = `0 ${scrollOffset.current}px`;
  }, []);

  const measure = useCallback(() => {
    for (const heading of Array.from(listRef.current?.querySelectorAll<HTMLElement>("h2") ?? [])) {
      heading.style.fontSize = "";
      fitTitle(heading);
      timeSweep(heading, PLAYER_SWEEP);
    }
    centre(indexRef.current);
  }, [centre]);

  const onLyricsResize = useCallback(
    (lyrics: HTMLElement, entry: ResizeObserverEntry) => {
      if (entry.contentRect.width === lyricsWidth.current) return;
      const first = lyricsWidth.current < 0;
      lyricsWidth.current = entry.contentRect.width;
      if (first) return;
      measure();
      const note = noteRef.current;
      const ink = inkRef.current;
      const scroller = scrollerRef.current;
      const line = linesIn(listRef.current)[indexRef.current];
      if (note?.hasAttribute("data-on") && ink && scroller && line)
        placeNote(line, lyrics, scroller, scrollOffset.current, note, ink);
    },
    [measure]
  );

  const lyricsRef = useResizeObserver<HTMLElement>(onLyricsResize);

  const focusLine = useCallback((line: HTMLElement) => {
    focusingLine.current = true;
    line.focus({ preventScroll: true });
    focusingLine.current = false;
  }, []);

  const select = useCallback(
    (target: number, move = true, carryFocus = true) => {
      const count = linesIn(listRef.current).length;
      if (!count) return;
      const i = Math.max(0, Math.min(count - 1, target));
      clearTimeout(hoverTimer.current);
      if (move) centre(i);
      indexRef.current = i;
      // A focused title follows the selection once its line is visible, so Enter opens what is highlighted.
      const focused = document.activeElement;
      followFocus.current = false;
      if (carryFocus && focused instanceof HTMLElement && focused.matches(".player-line")) {
        followFocus.current = i !== committedIndex.current;
        const line = linesIn(listRef.current)[i];
        if (!followFocus.current && line !== focused && line) focusLine(line);
      }
      setIndex(i);
    },
    [centre, focusLine]
  );

  const focusTitle = useCallback(
    (i: number, keyboard: boolean) => {
      if (focusingLine.current) return;
      clearTimeout(hoverTimer.current);
      if (i !== indexRef.current) select(i, keyboard);
      else if (keyboard) centre(i);
    },
    [select, centre]
  );

  const hover = useCallback(
    (i: number, e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (e.clientX === pointer.current.x && e.clientY === pointer.current.y) return;
      pointer.current = { x: e.clientX, y: e.clientY };
      clearTimeout(hoverTimer.current);
      if (i === indexRef.current) return;
      hoverTimer.current = setTimeout(() => select(i, false), HOVER_MS);
    },
    [select]
  );

  const unhover = useCallback(() => clearTimeout(hoverTimer.current), []);

  useLayoutEffect(() => () => clearTimeout(hoverTimer.current), [visible]);

  useLayoutEffect(() => {
    const vars = Object.entries(getPaletteVariables(NEUTRAL_COLORS));
    for (const [name, value] of vars) document.body.style.setProperty(name, value);
    return () => {
      for (const [name] of vars) document.body.style.removeProperty(name);
    };
  }, []);

  useEffect(() => {
    setProgress(Object.fromEntries(posts.map(post => [post.id, getProgress(post.id)])));
  }, [posts]);

  useEffect(() => {
    if (progress) setTimesReady(true);
  }, [progress]);

  useLayoutEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      measure();
      setMeasured(visible);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, measure]);

  useLayoutEffect(() => {
    indexRef.current = index;
    committedIndex.current = index;
    if (followFocus.current) {
      followFocus.current = false;
      const line = linesIn(listRef.current)[index];
      if (line) focusLine(line);
    }
    const note = noteRef.current;
    clearTimeout(drawTimer.current);
    const wasOn = note?.hasAttribute("data-on") ?? false;
    note?.removeAttribute("data-on");
    if (measured !== visible) return;
    const ink = inkRef.current;
    const lyrics = lyricsRef.current;
    const scroller = scrollerRef.current;
    const line = linesIn(listRef.current)[index];
    if (!note || !ink || !lyrics || !scroller || !line) return;
    drawTimer.current = setTimeout(
      () => {
        note.removeAttribute("data-drawn");
        note.removeAttribute("data-writing");
        ink.textContent = visible[index].note;
        placeNote(line, lyrics, scroller, scrollOffset.current, note, ink);
        void note.offsetWidth;
        note.setAttribute("data-on", "");
        note.setAttribute("data-drawn", "");
        note.setAttribute("data-writing", "");
      },
      wasOn ? NOTE_FADE_MS : 0
    );
  }, [index, measured, visible, lyricsRef]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isDesktop()) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      const step = KEY_STEPS.get(e.key);
      if (step === undefined) return;
      e.preventDefault();
      select(indexRef.current + step);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  useEffect(() => {
    let bank = 0;
    let idle: Timer;
    const onWheel = (e: WheelEvent) => {
      if (!isDesktop() || e.ctrlKey) return;
      clearTimeout(idle);
      idle = setTimeout(() => {
        bank = 0;
      }, WHEEL_IDLE_MS);
      bank += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      let steps = 0;
      while (Math.abs(bank) >= WHEEL_STEP_PX) {
        steps += Math.sign(bank);
        bank -= Math.sign(bank) * WHEEL_STEP_PX;
      }
      if (steps) select(indexRef.current + steps);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      clearTimeout(idle);
    };
  }, [select]);

  useEffect(() => {
    const phone = matchMedia(`(max-width: ${PHONE_MAX_PX}px)`);
    const lines = linesIn(listRef.current);
    const observer = new IntersectionObserver(
      () => {
        if (!phone.matches) return;
        const middle = window.innerHeight / 2;
        const distance = (line: HTMLElement) => {
          const { top, bottom } = line.getBoundingClientRect();
          return Math.abs((top + bottom) / 2 - middle);
        };
        const nearest = lines.reduce((best, line, i) => (distance(line) < distance(lines[best]) ? i : best), 0);
        select(nearest, false, false);
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    for (const line of lines) observer.observe(line);
    return () => observer.disconnect();
  }, [visible, select]);

  useEffect(
    () => () => {
      clearTimeout(hoverTimer.current);
      clearTimeout(drawTimer.current);
      clearTimeout(copyTimer.current);
    },
    []
  );

  const lines = useMemo(
    () =>
      visible.map((post, i) => {
        const { opacity, blur, hidden } = falloff(Math.abs(i - index));
        return (
          <li key={post.id}>
            <Link
              href={post.link}
              className="player-line"
              aria-label={post.title}
              data-cuelume-navigate
              data-active={i === index || undefined}
              style={{ ...cssVars({ "--o": opacity, "--b": `${blur}px` }), visibility: hidden ? "hidden" : undefined }}
              onPointerMove={e => hover(i, e)}
              onPointerLeave={unhover}
              onFocus={e => focusTitle(i, e.currentTarget.matches(":focus-visible"))}
            >
              <h2>
                <SungTitle title={post.title} />
              </h2>
            </Link>
          </li>
        );
      }),
    [visible, index, hover, unhover, focusTitle]
  );

  useWash(active?.image, active?.dim ?? 0);

  if (!active) return null;

  const done = progress?.[active.id] ?? 0;
  const atStart = empty || index === 0;
  const atEnd = empty || index === visible.length - 1;
  const cannotShuffle = visible.length < 2;

  const shuffle = () => {
    if (!current) return;
    const ids = visible.map(post => post.id);
    const read = Object.fromEntries(ids.map(id => [id, getProgress(id)]));
    const pick = visible.find(post => post.id === pickShuffle(ids, current.id, read, Math.random()));
    if (pick) router.push(pick.link);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(active.link, location.origin).href);
    } catch (error) {
      console.warn("copy failed", error);
      return;
    }
    play("success", { emphasis: "subtle" });
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <div className="player">
      <h1 className="sr-only">Posts</h1>
      <div className="player-stage">
        <section className="player-art enter [--i:1]" aria-label="Selected post">
          <Link className="player-cover" href={active.link} tabIndex={-1} aria-hidden="true">
            {posts.map((post, i) => (
              <Image
                key={post.id}
                src={post.image}
                alt=""
                fill
                sizes="(min-width: 861px) 40vw, 72px"
                preload={i === 0}
                data-on={post.id === active.id || undefined}
              />
            ))}
          </Link>
          <div className="player-track">
            <div>
              <PipLine className={`player-track-name ${handwriting.className}`} units={active.short.split(/(?<= )/)} />
              <PipLine
                className="player-track-sub"
                units={active.labels.flatMap((label, j) => (j ? ["·", label] : [label]))}
                delay={90}
                renderUnit={(unit, i) => (i === 0 ? <b>{unit}</b> : i % 2 ? <i>{unit}</i> : unit)}
              />
            </div>
          </div>
          <ProgressBar
            className="player-bar"
            progress={done}
            now={clock(active.minutes * done)}
            total={clock(active.minutes)}
            label={done ? `${Math.round(done * 100)}% read` : `${active.minutes} min read, not started`}
            delay={140}
            instant={!timesReady}
          />
          <div className="player-controls">
            <Control
              label="Random post"
              disabled={cannotShuffle}
              onPress={shuffle}
              data-cuelume-navigate={cannotShuffle ? undefined : ""}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 4l3 3l-3 3" />
                <path d="M18 20l3 -3l-3 -3" />
                <path d="M3 7h3a5 5 0 0 1 5 5a5 5 0 0 0 5 5h5" />
                <path d="M21 7h-5a4.978 4.978 0 0 0 -3 1m-4 8a4.984 4.984 0 0 1 -3 1h-3" />
              </svg>
            </Control>
            <div className="player-controls-mid">
              <Control
                label="Newer post"
                disabled={atStart}
                nudge="prev"
                onPress={() => select(indexRef.current - 1)}
                data-cuelume-navigate={atStart ? undefined : ""}
                data-cuelume-emphasis="subtle"
              >
                <PreviousIcon />
              </Control>
              <Link
                className="play-button"
                href={active.link}
                aria-label="Read"
                aria-disabled={empty}
                data-cuelume-navigate={empty ? undefined : ""}
                onClick={e => {
                  if (empty) e.preventDefault();
                  else retrigger(e.currentTarget, "control-pop", 320);
                }}
              >
                <PlayIcon />
              </Link>
              <Control
                label="Older post"
                disabled={atEnd}
                nudge="next"
                onPress={() => select(indexRef.current + 1)}
                data-cuelume-navigate={atEnd ? undefined : ""}
                data-cuelume-emphasis="subtle"
              >
                <NextIcon />
              </Control>
            </div>
            <Control label={copied ? "Link copied" : "Copy link"} disabled={empty} onPress={copy}>
              <span className="player-swap" data-state={copied ? "done" : "idle"}>
                <span className="player-swap-a">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 15l6 -6" />
                    <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
                    <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
                  </svg>
                </span>
                <span className="player-swap-b">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12l5 5l10 -10" />
                  </svg>
                </span>
              </span>
            </Control>
          </div>
        </section>
        <section
          ref={lyricsRef}
          className="player-lyrics enter [--i:2]"
          aria-label="Posts"
          onScroll={e => {
            e.currentTarget.scrollTop = 0;
          }}
          onPointerLeave={() => {
            clearTimeout(hoverTimer.current);
            centre(indexRef.current);
          }}
        >
          {empty && <p className={`player-empty ${handwriting.className}`}>nothing matches</p>}
          <div ref={scrollerRef} className="player-scroller">
            <ol ref={listRef} className="player-lines">
              {lines}
            </ol>
            <div ref={noteRef} className={`player-note ${handwriting.className}`} aria-hidden="true">
              <svg viewBox="0 0 34 26">
                <path pathLength={1} d="M30 22 C22 22 10 18 6 5" />
                <path pathLength={1} d="M2.5 10 L6 4.5 L11 8.5" />
              </svg>
              <span ref={inkRef} className="player-ink" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
