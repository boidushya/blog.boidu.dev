"use client";

import { createStore } from "@/utils/store";
import { Kawarp, type KawarpRef } from "@kawarp/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const SETTLE_MS = 180;
const FADE_MS = 1200;
const PAGE_FADE_MS = 600;

type WashImage = { src: string; dim: number };

const pageWash = createStore<WashImage | null>(null);

export function useWash(src: string | undefined, dim: number) {
  useEffect(() => pageWash.set(src ? { src, dim } : null), [src, dim]);
  useEffect(() => () => pageWash.set(null), []);
}

/** Mounted once in the layout, so the wash can fade out after the page that asked for it is gone. */
export function PageWash() {
  const image = pageWash.use();
  const [last, setLast] = useState(image);
  if (image && image !== last) setLast(image);
  if (!last) return null;
  return <Wash src={last.src} dim={last.dim} shown={!!image} />;
}

function Wash({ src, dim, shown: visible }: WashImage & { shown: boolean }) {
  const kawarp = useRef<KawarpRef>(null);
  const [first] = useState(src);
  const [ready, setReady] = useState(false);
  const [shownDim, setShownDim] = useState(dim);
  const reduceMotion = useReducedMotion();
  const shown = useRef({ src, busyUntil: 0 });

  useEffect(() => {
    if (!ready) return;
    if (visible && !reduceMotion) {
      kawarp.current?.start();
      return;
    }
    const stop = setTimeout(() => kawarp.current?.stop(), visible ? 0 : PAGE_FADE_MS);
    return () => clearTimeout(stop);
  }, [ready, reduceMotion, visible]);

  // Kawarp restarts a crossfade from the half-blended frame, so never start one during another.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const flush = () => {
      const wait = shown.current.busyUntil - performance.now();
      if (wait > 0) {
        timer = setTimeout(flush, wait);
        return;
      }
      if (shown.current.src === src) return;
      shown.current = { src, busyUntil: performance.now() + FADE_MS };
      kawarp.current
        ?.loadImage(src)
        .then(() => {
          if (reduceMotion) kawarp.current?.instance?.renderFrame();
        })
        .catch(error => console.warn(`Wash failed to load ${src}:`, error));
    };
    timer = setTimeout(() => {
      setShownDim(dim);
      flush();
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [src, dim, reduceMotion]);

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
        transitionDuration={FADE_MS}
        onLoad={() => {
          kawarp.current?.instance?.renderFrame();
          setReady(true);
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
