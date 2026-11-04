"use client";

import { createStore } from "@/utils/store";
import { Kawarp, type KawarpRef } from "@kawarp/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const SETTLE_MS = 180;
const FADE_MS = 1200;
const PAGE_FADE_MS = 600;
const RESIZE_SETTLE_MS = 150;
const LOAD_TIMEOUT_MS = 10_000;

type WashImage = { src: string; dim: number };

const pageWash = createStore<WashImage | null>(null);

export function useWash(src: string | undefined, dim: number) {
  useEffect(() => pageWash.set(src ? { src, dim } : null), [src, dim]);
  useEffect(() => () => pageWash.set(null), []);
}

/** Mounted once in the layout, so the wash can fade out after the page that asked for it is gone. */
export function PageWash() {
  const image = pageWash.use();
  const [state, setState] = useState({ image, last: image, visits: 0, hiddenAt: 0 });
  if (image !== state.image) {
    const now = performance.now();
    // Coming back after the fade-out finished starts a fresh wash; coming back mid-fade picks the old one up again.
    const faded = !state.image && now - state.hiddenAt >= PAGE_FADE_MS;
    setState({
      image,
      last: image ?? state.last,
      visits: image && faded ? state.visits + 1 : state.visits,
      hiddenAt: image ? state.hiddenAt : now,
    });
  }
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
  const fadeMs = () => (stillFrames.current ? 0 : FADE_MS);

  const loading = useRef(true);

  // Kawarp does not drop an older image that finishes loading late, so loads run one at a time.
  function load(target: string) {
    loading.current = true;
    const stalled = setTimeout(() => {
      loading.current = false;
    }, LOAD_TIMEOUT_MS);
    kawarp.current
      ?.loadImage(target)
      .then(() => {
        shown.current.busyUntil = performance.now() + fadeMs();
        if (stillFrames.current) kawarp.current?.instance?.renderFrame();
      })
      .catch(error => {
        console.warn(`Wash failed to load ${target}:`, error);
        if (shown.current.src === target) shown.current.src = "";
      })
      .finally(() => {
        clearTimeout(stalled);
        loading.current = false;
      });
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
      const wait = loading.current ? SETTLE_MS : shown.current.busyUntil - performance.now();
      if (wait > 0) {
        timer = setTimeout(flush, wait);
        return;
      }
      setShownDim(dim);
      if (shown.current.src === src) return;
      shown.current = { src, busyUntil: performance.now() + fadeMs() };
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
        transitionDuration={fadeMs()}
        onLoad={() => {
          kawarp.current?.instance?.renderFrame();
          loading.current = false;
          setReady(true);
        }}
        onError={error => {
          console.warn(`Wash failed to load ${first}:`, error);
          loading.current = false;
          setReady(true);
          shown.current.src = "";
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
