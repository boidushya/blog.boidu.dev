"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULT_WIDTH = 280;
const GAP = 12;
const EDGE = 8;
const CLOSE_DELAY = 80;
const VIDEO = /\.(mp4|webm|mov)(\?|#|$)/i;

type Props = {
  src: string;
  alt: string;
  /** Popover width in px, for clips with small text. Never wider than the screen. A string, because MDX props can't carry numbers. */
  width?: `${number}`;
  children: React.ReactNode;
};

function lineRectAt(el: HTMLElement, clientY?: number) {
  const rects = Array.from(el.getClientRects());
  if (clientY === undefined) return rects[0] ?? el.getBoundingClientRect();
  return rects.find(r => clientY >= r.top && clientY <= r.bottom) ?? rects[0] ?? el.getBoundingClientRect();
}

export function Peek({ src, alt, width: wantedWidth, children }: Props) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const closeTimer = useRef<number>(undefined);
  const pointer = useRef<{ x: number; y: number }>(undefined);
  const [mounted, setMounted] = useState(false);
  const [near, setNear] = useState(false);
  const [open, setOpen] = useState(false);
  const [below, setBelow] = useState(false);

  const [ratio, setRatio] = useState(16 / 9);
  const fullWidth = wantedWidth ? Number(wantedWidth) : DEFAULT_WIDTH;
  const width = mounted ? Math.min(fullWidth, window.innerWidth - 2 * EDGE) : fullWidth;
  const height = width / ratio;
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 420, damping: 42, mass: 0.6 });
  const springY = useSpring(rawY, { stiffness: 420, damping: 42, mass: 0.6 });
  const x = reduceMotion ? rawX : springX;
  const y = reduceMotion ? rawY : springY;
  const isVideo = VIDEO.test(src);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const place = useCallback(
    (jump: boolean) => {
      const el = triggerRef.current;
      if (!el) return;
      const line = lineRectAt(el, pointer.current?.y);
      const centerX = pointer.current?.x ?? line.left + line.width / 2;
      const nextX = Math.min(Math.max(centerX - width / 2, EDGE), window.innerWidth - width - EDGE);
      const flip = line.top - height - GAP < EDGE;
      const nextY = flip ? line.bottom + GAP : line.top - height - GAP;
      setBelow(flip);
      rawX.set(nextX);
      rawY.set(nextY);
      if (jump) {
        springX.jump(nextX);
        springY.jump(nextY);
      }
    },
    [width, height, rawX, rawY, springX, springY]
  );

  const show = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    if (open) return;
    place(true);
    setOpen(true);
    const video = mediaRef.current;
    if (video && !reduceMotion) {
      video.currentTime = 0;
      video.play().catch((error: DOMException) => {
        if (error.name !== "AbortError") throw error;
      });
    }
  }, [open, place, reduceMotion]);

  const hide = useCallback((delay = 0) => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), delay);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => place(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    const onDown = (e: PointerEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) hide();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, place, hide]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: below ? -4 : 4, filter: "blur(4px)" };
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" };

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        className="rounded-sm underline decoration-dotted decoration-accent-400/60 decoration-[1.5px] underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-accent-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        onPointerEnter={e => {
          if (e.pointerType === "touch") return;
          pointer.current = { x: e.clientX, y: e.clientY };
          show();
        }}
        onPointerMove={e => {
          if (e.pointerType === "touch") return;
          pointer.current = { x: e.clientX, y: e.clientY };
          place(false);
        }}
        onPointerLeave={e => e.pointerType !== "touch" && hide(CLOSE_DELAY)}
        onClick={e => {
          if ((e.nativeEvent as PointerEvent).pointerType !== "touch") return;
          pointer.current = { x: e.clientX, y: e.clientY };
          open ? hide() : show();
        }}
        onFocus={e => {
          if (!e.currentTarget.matches(":focus-visible")) return;
          pointer.current = undefined;
          show();
        }}
        onBlur={() => hide()}
      >
        {children}
      </span>
      {mounted &&
        createPortal(
          <motion.div
            className="fixed top-0 left-0 z-50 pointer-events-none"
            style={{ x, y, width, height }}
            aria-hidden={!open}
          >
            <motion.div
              id={id}
              role="tooltip"
              onPointerEnter={() => window.clearTimeout(closeTimer.current)}
              onPointerLeave={() => hide(CLOSE_DELAY)}
              className={`${open ? "pointer-events-auto" : ""} w-full h-full p-1 rounded-xl bg-accent-900 shadow-deep will-change-[transform,opacity,filter]`}
              style={{ transformOrigin: below ? "50% 0%" : "50% 100%" }}
              initial={false}
              animate={open ? shown : hidden}
              transition={
                open ? { type: "spring", duration: 0.28, bounce: 0 } : { duration: 0.14, ease: [0.4, 0, 1, 1] }
              }
              onAnimationComplete={() => {
                if (!open) mediaRef.current?.pause();
              }}
            >
              {isVideo ? (
                <video
                  aria-label={alt}
                  ref={mediaRef}
                  src={src}
                  muted
                  loop
                  playsInline
                  preload={near ? "auto" : "none"}
                  onLoadedMetadata={e => setRatio(e.currentTarget.videoWidth / e.currentTarget.videoHeight)}
                  className="block w-full h-full object-cover rounded-lg outline outline-1 -outline-offset-1 outline-accent-50/10"
                />
              ) : (
                <img
                  src={near ? src : undefined}
                  alt={alt}
                  onLoad={e => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                  decoding="async"
                  className="block w-full h-full object-cover rounded-lg outline outline-1 -outline-offset-1 outline-accent-50/10"
                />
              )}
            </motion.div>
          </motion.div>,
          document.body
        )}
    </>
  );
}
