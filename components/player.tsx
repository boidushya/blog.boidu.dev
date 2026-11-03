"use client";

import { SungTitle } from "@/components/sung-title";
import { Wash } from "@/components/wash";
import type { BlogCard } from "@/lib/blogs";
import { handwriting } from "@/utils/fonts";
import { useResizeObserver, useWaterMark } from "@/utils/hooks";
import { matchesSearch, usePostSearch } from "@/utils/post-search";
import { clock, getProgress, pickShuffle } from "@/utils/reading-progress";
import { timeSweep } from "@/utils/sweep";
import { getThemeVariables } from "@/utils/themeConfig";
import { play } from "cuelume";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
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
  const width = lyrics.clientWidth;
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

function retrigger(el: HTMLElement, className: string, ms: number) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), ms);
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

const sameUnits = (a: string[], b: string[]) => a.length === b.length && a.every((unit, i) => unit === b[i]);

type Layers = { front: 0 | 1; content: [string[], string[]]; animate: boolean };

function PipLine({
  units,
  delay = 0,
  instant = false,
  className = "",
  renderUnit = unit => unit,
}: {
  units: string[];
  delay?: number;
  instant?: boolean;
  className?: string;
  renderUnit?: (unit: string, i: number) => ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<Timer>(undefined);
  const [layers, setLayers] = useState<Layers>({ front: 0, content: [units, []], animate: false });

  const shown = layers.content[layers.front];
  if (!sameUnits(shown, units)) {
    setLayers({
      front: layers.front === 0 ? 1 : 0,
      content: layers.front === 0 ? [shown, units] : [units, shown],
      animate: !instant,
    });
  }

  useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;
    clearTimeout(timer.current);
    if (!layers.animate) {
      row.removeAttribute("data-swapping");
      return;
    }
    row.setAttribute("data-swapping", "false");
    void row.offsetWidth;
    row.style.setProperty("--line-delay", `${delay}ms`);
    row.setAttribute("data-swapping", "true");
    const count = layers.content[layers.front].length;
    timer.current = setTimeout(() => row.removeAttribute("data-swapping"), 620 + count * 45 + delay + 50);
  }, [layers, delay]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <span ref={ref} className={`player-pip-line ${className}`}>
      {layers.content.map((layer, n) => (
        <span key={n} className="player-pip-layer" data-front={String(layers.front === n)}>
          {layer.map((unit, i) => (
            <span key={i} className="player-pip-unit" style={cssVars({ "--i": i })}>
              {renderUnit(unit, i)}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
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
        retrigger(button, "player-pop", 320);
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
  const visible = useMemo(() => posts.filter(post => matchesSearch(post, query)), [posts, query]);

  const [index, setIndex] = useState(0);
  const [shownQuery, setShownQuery] = useState(query);
  if (shownQuery !== query) {
    setShownQuery(query);
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
      lyricsWidth.current = entry.contentRect.width;
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

  const select = useCallback(
    (target: number, move = true) => {
      const count = linesIn(listRef.current).length;
      if (!count) return;
      const i = Math.max(0, Math.min(count - 1, target));
      if (move) centre(i);
      indexRef.current = i;
      setIndex(i);
    },
    [centre]
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

  useEffect(() => {
    const vars = Object.entries(getThemeVariables("obsidian"));
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
      const target = e.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.matches("input, textarea, select")))
        return;
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
      if (!isDesktop()) return;
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
      entries => {
        if (!phone.matches) return;
        for (const entry of entries) {
          if (entry.isIntersecting)
            select(
              lines.findIndex(line => line === entry.target),
              false
            );
        }
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
              onFocus={e => select(i, e.currentTarget.matches(":focus-visible"))}
            >
              <h2>
                <SungTitle title={post.title} />
              </h2>
            </Link>
          </li>
        );
      }),
    [visible, index, hover, unhover, select]
  );

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
      <Wash src={active.image} dim={active.dim} />
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
          <div
            className="player-bar"
            role="img"
            aria-label={done ? `${Math.round(done * 100)}% read` : `${active.minutes} min read, not started`}
          >
            <div className="player-bar-clip">
              <div className="player-bar-fill" style={cssVars({ "--p": done })} />
            </div>
            <div className="player-bar-times" aria-hidden="true">
              <PipLine units={Array.from(clock(active.minutes * done))} delay={140} instant={!timesReady} />
              <PipLine units={Array.from(clock(active.minutes))} delay={180} instant={!timesReady} />
            </div>
          </div>
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <g fill="none">
                    <path d="M24 0v24H0V0z" />
                    <path
                      fill="currentColor"
                      d="m20.43 5.865.078.699.072.767.036.448.051.75.03.55.038.894.019.641.012.675.004.707-.004.707-.012.675-.019.641-.024.606-.028.569-.05.78-.035.47-.09.986-.079.698a1.332 1.332 0 0 1-1.844 1.065l-.49-.213-.846-.386-.62-.298-.458-.226-.748-.381-.538-.283-.566-.306-.594-.329-.619-.353-.615-.36-.582-.349-.809-.5-.73-.47-.443-.292-.406-.274-.54-.373-.587-.42-.43-.319a1.332 1.332 0 0 1 .002-2.13l.325-.242.422-.306.517-.363.607-.414.694-.458.51-.327.546-.342.581-.355.617-.366.32-.186c.208-.12.412-.237.613-.349l.588-.326.563-.304.793-.414.725-.365.442-.215.597-.283.802-.362.355-.154a1.332 1.332 0 0 1 1.846 1.065ZM6 5a1 1 0 0 1 .993.883L7 6v12a1 1 0 0 1-.883.993L6 19H5a1 1 0 0 1-.993-.883L4 18V6a1 1 0 0 1 .883-.993L5 5z"
                    />
                  </g>
                </svg>
              </Control>
              <Link
                className="player-btn player-play"
                href={active.link}
                aria-label="Read"
                aria-disabled={empty}
                data-cuelume-navigate={empty ? undefined : ""}
                onClick={e => {
                  if (empty) e.preventDefault();
                  else retrigger(e.currentTarget, "player-pop", 320);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <g fill="none" fillRule="evenodd">
                    <path d="M24 0v24H0V0z" />
                    <path
                      fill="currentColor"
                      d="M5.669 4.76a1.469 1.469 0 0 1 2.04-1.177c1.062.454 3.442 1.533 6.462 3.276 3.021 1.744 5.146 3.267 6.069 3.958.788.591.79 1.763.001 2.356-.914.687-3.013 2.19-6.07 3.956-3.06 1.766-5.412 2.832-6.464 3.28-.906.387-1.92-.2-2.038-1.177-.138-1.142-.396-3.735-.396-7.237 0-3.5.257-6.092.396-7.235"
                    />
                  </g>
                </svg>
              </Link>
              <Control
                label="Older post"
                disabled={atEnd}
                nudge="next"
                onPress={() => select(indexRef.current + 1)}
                data-cuelume-navigate={atEnd ? undefined : ""}
                data-cuelume-emphasis="subtle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <g fill="none">
                    <path d="M24 0v24H0V0z" />
                    <path
                      fill="currentColor"
                      d="M3.569 5.865A1.332 1.332 0 0 1 5.415 4.8l.646.283.511.233.597.283.676.331.49.249.793.414.564.304.588.326.613.349.633.37.599.361.564.349.778.496.694.458.607.414.517.363.541.394.206.154c.71.535.71 1.594.001 2.13l-.43.319-.273.198-.664.465-.595.404-.443.292-.73.47-.81.5-.581.35-.615.36-.62.352-.593.33-.566.305-.538.283-.748.381-.673.331-.773.364-.744.332-.224.096a1.332 1.332 0 0 1-1.844-1.065l-.08-.698-.071-.767-.053-.689-.05-.78-.028-.57-.024-.605-.019-.64-.015-1.026v-.715l.015-1.024.03-.948.026-.587.03-.55.052-.75.054-.657.07-.722zM19 5a1 1 0 0 1 .993.883L20 6v12a1 1 0 0 1-.883.993L19 19h-1a1 1 0 0 1-.993-.883L17 18V6a1 1 0 0 1 .883-.993L18 5z"
                    />
                  </g>
                </svg>
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
