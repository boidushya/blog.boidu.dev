"use client";

import { createStore } from "@/utils/store";
import { Kawarp, type KawarpRef } from "@kawarp/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const SETTLE_MS = 180;
const FADE_MS = 1200;
const PAGE_FADE_MS = 600;
const RESIZE_SETTLE_MS = 150;

type WashImage = { src: string; dim: number };

const pageWash = createStore<WashImage | null>(null);

export function useWash(src: string | undefined, dim: number) {
  useEffect(() => pageWash.set(src ? { src, dim } : null), [src, dim]);
  useEffect(() => () => pageWash.set(null), []);
}

/** Mounted once in the layout, so the wash can fade out after the page that asked for it is gone. */
export function PageWash() {
  const image = pageWash.use();
  const [state, setState] = useState({ image, last: image, visits: 0 });
  if (image !== state.image)
    setState({ image, last: image ?? state.last, visits: image && !state.image ? state.visits + 1 : state.visits });
  if (!state.last) return null;
  return <Wash key={state.visits} src={state.last.src} dim={state.last.dim} shown={!!image} />;
}

function Wash({ src, dim, shown: visible }: WashImage & { shown: boolean }) {
  const kawarp = useRef<KawarpRef>(null);
  const [first] = useState(src);
  const [ready, setReady] = useState(false);
  const [shownDim, setShownDim] = useState(dim);
  const reduceMotion = useReducedMotion();
  const shown = useRef({ src, busyUntil: 0 });
  const stillFrames = useRef(reduceMotion);
  stillFrames.current = reduceMotion;

  // Kawarp does not drop an older image that finishes loading late, so the latest choice is loaded again over it.
  function load(target: string) {
    kawarp.current
      ?.loadImage(target)
      .then(() => {
        if (shown.current.src !== target) return load(shown.current.src);
        shown.current.busyUntil = performance.now() + FADE_MS;
        if (stillFrames.current) kawarp.current?.instance?.renderFrame();
      })
      .catch(error => console.warn(`Wash failed to load ${target}:`, error));
  }

  useEffect(() => {
    if (!ready) return;
    if (visible && !reduceMotion) {
      kawarp.current?.start();
      return;
    }
    const stop = setTimeout(() => kawarp.current?.stop(), visible ? 0 : PAGE_FADE_MS);
    return () => clearTimeout(stop);
  }, [ready, reduceMotion, visible]);

  // Resizing clears the canvas, and a stopped wash draws nothing until asked.
  useEffect(() => {
    if (!ready || (visible && !reduceMotion)) return;
    let timer: ReturnType<typeof setTimeout>;
    const redraw = () => {
      clearTimeout(timer);
      timer = setTimeout(() => kawarp.current?.instance?.renderFrame(), RESIZE_SETTLE_MS);
    };
    window.addEventListener("resize", redraw);
    return () => {
      window.removeEventListener("resize", redraw);
      clearTimeout(timer);
    };
  }, [ready, visible, reduceMotion]);

  // Kawarp restarts a crossfade from the half-blended frame, so never start one during another.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const flush = () => {
      const wait = shown.current.busyUntil - performance.now();
      if (wait > 0) {
        timer = setTimeout(flush, wait);
        return;
      }
      setShownDim(dim);
      if (shown.current.src === src) return;
      shown.current = { src, busyUntil: performance.now() + FADE_MS };
      load(src);
    };
    timer = setTimeout(flush, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [src, dim]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 bg-[oklch(0.1_0.01_270)] transition-opacity duration-[600ms] ease-out"
      style={{ opacity: visible && ready ? 1 : 0 }}
    >
      <Kawarp
        ref={kawarp}
        src={first}
        autoPlay={false}
        blurPasses={8}
        animationSpeed={1.6}
        saturation={1.4}
        warpIntensity={0.9}
        transitionDuration={reduceMotion ? 0 : FADE_MS}
        onLoad={() => {
          kawarp.current?.instance?.renderFrame();
          setReady(true);
          if (shown.current.src !== first) load(shown.current.src);
        }}
        style={{ position: "absolute", inset: 0 }}
      />
      <div
        className="absolute inset-0 bg-[oklch(0.1_0.01_270)] transition-opacity duration-[1200ms] ease-out"
        style={{ opacity: shownDim }}
      />
    </div>
  );
}
