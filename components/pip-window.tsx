"use client";

import { RollingText } from "@/components/pip-line";
import { PlayIcon } from "@/components/player-icons";
import { TrackName, TrackTags } from "@/components/track-lines";
import { WASH_FADE_MS, WASH_SETTLE_MS } from "@/components/wash";
import type { BlogCard } from "@/lib/blogs";
import type { CSSVars } from "@/utils/css-vars";
import { clamp01 } from "@/utils/math";
import { prefersReducedMotion } from "@/utils/motion";
import { resumeNext } from "@/utils/reading-progress";
import { pop } from "@/utils/retrigger";
import Image from "next/image";
import Link from "next/link";
import { type RefObject, useEffect, useId, useRef, useState } from "react";

const PEEK = 84;
const MARGIN = 16;
const WIDTH = 0.62;
const MAX_HEIGHT = 0.5;
const MAX_WIDTH_PX = 320;
const TILT_DEG = 8;
const DETAIL_FROM = 0.55;
const STACK_GAP = 24;
const NOTE_GAP = 12;
const NAV_CLEAR = 96;
const TAP_SLOP = 6;
const FLICK = 400;
const PULL_OPEN = 0.2;
const PROJECT = 0.18;
const SAMPLE_MS = 80;
const STALE_MS = 60;
const STIFFNESS = 420;
const DAMPING = 2 * 0.9 * Math.sqrt(STIFFNESS);
const SUBSTEPS = 4;
const FADE_MS = 200;
const HINT_AFTER_MS = 1400;
const HINT_HOLD_MS = 2400;
const HINTED_KEY = "pip-hinted";
const ART_SIZES = `(min-width: ${Math.ceil(MAX_WIDTH_PX / WIDTH)}px) ${MAX_WIDTH_PX}px, ${WIDTH * 100}vw`;

type Parts = Record<"frame" | "card" | "art" | "handle" | "toggle" | "play" | "label" | "glow", HTMLElement>;

type Sample = { t: number; x: number; y: number };

type Drag = {
  id: number;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  mid: number;
  caught: boolean;
  moved: boolean;
  tucked: boolean;
  samples: Sample[];
};

const rubber = (over: number, dim: number) => (1 - 1 / ((over * 0.55) / dim + 1)) * dim;

function band(value: number, lo: number, hi: number, dim: number) {
  if (value < lo) return lo - rubber(lo - value, dim);
  if (value > hi) return hi + rubber(value - hi, dim);
  return value;
}

function partsIn(root: HTMLElement): Parts | null {
  const part = (name: keyof Parts) => root.querySelector<HTMLElement>(`.pip-${name}`);
  const [frame, card, art, handle, toggle, play, label, glow] = [
    part("frame"),
    part("card"),
    part("art"),
    part("handle"),
    part("toggle"),
    part("play"),
    part("label"),
    part("glow"),
  ];
  if (!frame || !card || !art || !handle || !toggle || !play || !label || !glow) return null;
  return { frame, card, art, handle, toggle, play, label, glow };
}

/** Drives the window with a spring: y is the lift above the bottom spot, so 0 rests there. */
function stash(
  root: HTMLElement,
  parts: Parts,
  anchor: () => Element | null,
  onOpen: (open: boolean) => void,
  onHint?: () => void
) {
  const { frame, card, art, handle, toggle, play, label, glow } = parts;
  let w = 0;
  let h = 0;
  let openX = 0;
  let stashX = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let tx = 0;
  let ty = 0;
  let open = false;
  let atMid = false;
  let raf = 0;
  let last = 0;
  let drag: Drag | null = null;
  let swallowTap = false;
  let hintTimer: ReturnType<typeof setTimeout> | undefined;

  const measure = () => {
    const width = document.documentElement.clientWidth;
    w = Math.round(Math.min(width * WIDTH, MAX_WIDTH_PX, (innerHeight * MAX_HEIGHT * 16) / 9));
    h = Math.round((w * 9) / 16);
    root.style.setProperty("--w", `${w}px`);
    root.style.setProperty("--h", `${h}px`);
    openX = width - MARGIN - w;
    stashX = width - PEEK;
  };

  const midY = () => {
    const base = frame.getBoundingClientRect().top - y;
    const note = anchor()?.getBoundingClientRect();
    const top = Math.max(note ? note.bottom + NOTE_GAP : 0, NAV_CLEAR) - label.offsetTop;
    return Math.min(top - base, -(h + STACK_GAP));
  };

  const render = () => {
    const p = clamp01((stashX - x) / (stashX - openX));
    const shift = (w / 2 - PEEK / 2) * (1 - p);
    const detail = clamp01((p - DETAIL_FROM) / (1 - DETAIL_FROM));
    frame.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    card.style.rotate = `y ${-TILT_DEG * (1 - p)}deg`;
    art.style.transform = `translateX(${-shift}px)`;
    play.style.opacity = String(detail);
    play.style.scale = String(0.8 + 0.2 * detail);
    handle.style.opacity = String(1 - clamp01(p * 2.2));
    glow.style.opacity = String(0.6 + 0.4 * p);
    glow.style.transform = `translate3d(${x - shift}px, ${y}px, 0) scale(${0.4 + 0.6 * p}, ${1.15 - 0.15 * p})`;
  };

  const rest = () => frame.toggleAttribute("data-shown", open);

  const step = (now: number) => {
    const dt = Math.min((now - (last || now)) / 1000, 1 / 30) / SUBSTEPS;
    last = now;
    for (let i = 0; i < SUBSTEPS; i++) {
      vx += (-STIFFNESS * (x - tx) - DAMPING * vx) * dt;
      vy += (-STIFFNESS * (y - ty) - DAMPING * vy) * dt;
      x += vx * dt;
      y += vy * dt;
    }
    const settled = Math.abs(x - tx) < 0.25 && Math.abs(y - ty) < 0.25 && Math.abs(vx) < 4 && Math.abs(vy) < 4;
    if (settled) {
      x = tx;
      y = ty;
      vx = 0;
      vy = 0;
    }
    render();
    raf = settled ? 0 : requestAnimationFrame(step);
    if (settled) rest();
  };

  const settle = (nextOpen: boolean, nextMid = atMid) => {
    open = nextOpen;
    atMid = nextMid;
    onOpen(open);
    if (!open && document.activeElement === play) toggle.focus();
    tx = open ? openX : stashX;
    ty = atMid ? midY() : 0;
    cancelAnimationFrame(raf);
    frame.removeAttribute("data-shown");
    if (prefersReducedMotion()) {
      x = tx;
      y = ty;
      vx = 0;
      vy = 0;
      raf = 0;
      render();
      rest();
      card.animate({ opacity: [0, 1] }, { duration: FADE_MS, easing: "ease-out" });
      glow.animate({ opacity: ["0", glow.style.opacity] }, { duration: FADE_MS, easing: "ease-out" });
      return;
    }
    last = 0;
    raf = requestAnimationFrame(step);
  };

  const place = () => {
    measure();
    if (drag) return;
    if (raf) return settle(open);
    tx = open ? openX : stashX;
    ty = atMid ? midY() : 0;
    x = tx;
    y = ty;
    render();
  };

  const onDown = (e: PointerEvent) => {
    clearTimeout(hintTimer);
    if (drag || e.button !== 0 || (e.target instanceof Element && e.target.closest(".pip-play"))) return;
    const caught = raf !== 0;
    cancelAnimationFrame(raf);
    raf = 0;
    swallowTap = false;
    drag = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ox: x,
      oy: y,
      mid: midY(),
      caught,
      moved: false,
      tucked: !open,
      samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }],
    };
    frame.setAttribute("data-held", "");
  };

  const onMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (e.buttons === 0) return onRelease(e);
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) <= TAP_SLOP) return;
      drag.moved = true;
      frame.setPointerCapture(e.pointerId);
      frame.removeAttribute("data-shown");
    }
    x = band(drag.ox + dx, openX, stashX, w);
    y = band(drag.oy + dy, drag.mid, 0, h);
    drag.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > SAMPLE_MS) drag.samples.shift();
    render();
  };

  const onRelease = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { moved, caught, samples, mid, tucked } = drag;
    drag = null;
    frame.removeAttribute("data-held");
    if (!moved) {
      // Catching the window mid-flight is a grab, not a tap, so it resumes instead of opening the post.
      if (caught) {
        swallowTap = true;
        settle(open);
      }
      return;
    }
    swallowTap = true;
    const first = samples[0];
    const latest = samples[samples.length - 1];
    const span = Math.max(latest.t - first.t, 1) / 1000;
    const still = e.type === "pointercancel" || e.timeStamp - latest.t > STALE_MS;
    vx = still ? 0 : (latest.x - first.x) / span;
    vy = still ? 0 : (latest.y - first.y) / span;
    const projected = (stashX - (x + vx * PROJECT)) / (stashX - openX);
    const landing = y + vy * PROJECT;
    // A short pull on the tucked window's grab bar is enough to open it.
    settle(
      Math.abs(vx) > FLICK ? vx < 0 : projected > (tucked ? PULL_OPEN : 0.5),
      Math.abs(landing - mid) < Math.abs(landing)
    );
  };

  const onClick = (e: MouseEvent) => {
    clearTimeout(hintTimer);
    if (e.detail === 0) return settle(!open);
    if (swallowTap) {
      swallowTap = false;
      return;
    }
    if (open) play.click();
    else settle(true);
  };

  const onKey = (e: KeyboardEvent) => {
    clearTimeout(hintTimer);
    if (e.key !== "Escape" || !open) return;
    settle(false);
    toggle.focus();
  };

  measure();
  x = tx = stashX;
  render();
  frame.addEventListener("pointerdown", onDown);
  frame.addEventListener("pointermove", onMove);
  frame.addEventListener("pointerup", onRelease);
  frame.addEventListener("pointercancel", onRelease);
  frame.addEventListener("keydown", onKey);
  toggle.addEventListener("click", onClick);
  addEventListener("resize", place);
  // A stranger cannot tell what the tucked edge is, so on a first visit it opens once by itself and tucks back.
  if (onHint)
    hintTimer = setTimeout(() => {
      if (open || drag || !frame.getClientRects().length) return;
      onHint();
      settle(true);
      hintTimer = setTimeout(() => {
        if (open && !drag) settle(false);
      }, HINT_HOLD_MS);
    }, HINT_AFTER_MS);
  return () => {
    clearTimeout(hintTimer);
    cancelAnimationFrame(raf);
    frame.removeEventListener("pointerdown", onDown);
    frame.removeEventListener("pointermove", onMove);
    frame.removeEventListener("pointerup", onRelease);
    frame.removeEventListener("pointercancel", onRelease);
    frame.removeEventListener("keydown", onKey);
    toggle.removeEventListener("click", onClick);
    removeEventListener("resize", place);
  };
}

function Art({ posts, active }: { posts: BlogCard[]; active: string }) {
  return posts.map(post => (
    <Image
      key={post.id}
      src={post.image}
      alt=""
      fill
      sizes={ART_SIZES}
      draggable={false}
      data-on={post.id === active || undefined}
    />
  ));
}

type Props = {
  posts: BlogCard[];
  post: BlogCard;
  read: number;
  disabled: boolean;
  anchorRef: RefObject<HTMLElement | null>;
};

/** The phone player: a picture-in-picture window stashed in the screen edge, pulled in to open. */
export function PipWindow({ posts, post, read, disabled, anchorRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const pct = Math.round(read * 100);
  const style: CSSVars = {
    "--peek": `${PEEK}px`,
    "--read": read,
    "--wash-fade": `${WASH_FADE_MS}ms`,
    "--wash-settle": `${WASH_SETTLE_MS}ms`,
  };

  useEffect(() => {
    const root = rootRef.current;
    const parts = root && partsIn(root);
    if (!root || !parts) return;
    const onHint = localStorage.getItem(HINTED_KEY) ? undefined : () => localStorage.setItem(HINTED_KEY, "1");
    return stash(root, parts, () => anchorRef.current, setOpen, onHint);
  }, [anchorRef]);

  return (
    <div ref={rootRef} className="pip-window" style={style}>
      <div className="pip-glow" aria-hidden="true">
        <div className="pip-glow-in enter [--i:1]">
          {posts.map(each => (
            <span key={each.id} className="pip-glow-post" data-on={each.id === post.id || undefined}>
              <span className="pip-glow-far">
                <Image src={each.image} alt="" fill sizes={ART_SIZES} draggable={false} />
              </span>
              <span className="pip-glow-near">
                <Image src={each.image} alt="" fill sizes={ART_SIZES} draggable={false} />
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="pip-frame">
        <div className="pip-body enter [--i:1]">
          <div className="pip-card">
            <div className="pip-art">
              <Art posts={posts} active={post.id} />
              <div className="pip-unread">
                <Art posts={posts} active={post.id} />
              </div>
              <span className="pip-mark" data-edge={read <= 0 || read >= 1 || undefined} />
            </div>
            <span className="pip-handle" />
            <button
              type="button"
              className="pip-toggle"
              aria-expanded={open}
              aria-controls={labelId}
              aria-label={`Player for ${post.title}, ${pct}% read`}
              data-cuelume-open={open ? undefined : "open"}
            />
            <Link
              className="play-button pip-play"
              href={post.link}
              aria-label={`Read ${post.title}`}
              aria-disabled={disabled}
              inert={!open}
              data-cuelume-navigate={disabled ? undefined : ""}
              onClick={e => {
                if (disabled) return e.preventDefault();
                pop(e.currentTarget);
                resumeNext(post.id);
              }}
            >
              <PlayIcon />
            </Link>
          </div>
          <div id={labelId} className="pip-label" aria-hidden={!open}>
            <TrackName post={post} className="pip-name" />
            <span className="pip-meta">
              <span className="pip-pct">
                <RollingText text={`${pct}%`} />
              </span>
              <TrackTags post={post} className="pip-tags" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
