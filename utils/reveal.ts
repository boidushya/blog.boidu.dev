import { type RefObject, useEffect, useRef, useState } from "react";

// Reveals within this gap of the last audible one stay silent, so reveals landing together never stack.
const QUIET_GAP_MS = 1200;
// Scrolling faster than a screen height in this long skims past reveals instead of reading them.
const SKIM_SCREEN_MS = 300;
const SAMPLE_MS = 100;
const SETTLE_MS = 200;

let jumping = false;
let skimming = false;
let lastRevealAt = Number.NEGATIVE_INFINITY;
const waiting = new Set<() => void>();

function flush() {
  if (jumping || skimming) return;
  for (const reveal of Array.from(waiting)) reveal();
}

/** Marks a chapter rail jump, so the reveals it scrolls past stay unplayed until it lands. */
export function startJump() {
  jumping = true;
}

export function endJump() {
  jumping = false;
  flush();
}

let watchingScroll = false;

function watchScroll() {
  if (watchingScroll) return;
  watchingScroll = true;
  let sample = { y: window.scrollY, at: performance.now() };
  let settle: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      if (now - sample.at >= SAMPLE_MS) {
        const pxPerMs = Math.abs(window.scrollY - sample.y) / (now - sample.at);
        if (pxPerMs > window.innerHeight / SKIM_SCREEN_MS) skimming = true;
        sample = { y: window.scrollY, at: now };
      }
      clearTimeout(settle);
      settle = setTimeout(() => {
        sample = { y: window.scrollY, at: performance.now() };
        if (!skimming) return;
        skimming = false;
        flush();
      }, SETTLE_MS);
    },
    { passive: true }
  );
}

/** Calls onReveal once, the first time `amount` of el is in view outside a rail jump or a fast skim; `quiet` means skip the sound. */
export function observeReveal(el: Element, amount: number, onReveal: (quiet: boolean) => void) {
  watchScroll();
  let inView = false;
  const reveal = () => {
    if (!inView || jumping || skimming) return;
    stop();
    const now = performance.now();
    const quiet = now - lastRevealAt < QUIET_GAP_MS;
    if (!quiet) lastRevealAt = now;
    onReveal(quiet);
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      reveal();
    },
    { threshold: amount }
  );
  const stop = () => {
    observer.disconnect();
    waiting.delete(reveal);
  };
  observer.observe(el);
  waiting.add(reveal);
  return stop;
}

/** `observeReveal` as React state: true once `ref` has been revealed. */
export function useReveal(ref: RefObject<HTMLElement | null>, amount: number, onReveal?: (quiet: boolean) => void) {
  const [shown, setShown] = useState(false);
  const latest = useRef(onReveal);
  latest.current = onReveal;
  useEffect(() => {
    if (!ref.current) return;
    return observeReveal(ref.current, amount, quiet => {
      setShown(true);
      latest.current?.(quiet);
    });
  }, [ref, amount]);
  return shown;
}
