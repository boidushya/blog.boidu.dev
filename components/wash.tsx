"use client";

import { Kawarp, type KawarpRef } from "@kawarp/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const SETTLE_MS = 180;
const FADE_MS = 1200;

export function Wash({ src, dim }: { src: string; dim: number }) {
  const kawarp = useRef<KawarpRef>(null);
  const [first] = useState(src);
  const [ready, setReady] = useState(false);
  const [shownDim, setShownDim] = useState(dim);
  const reduceMotion = useReducedMotion();
  const shown = useRef({ src, busyUntil: 0 });

  useEffect(() => {
    if (!ready) return;
    if (reduceMotion) kawarp.current?.stop();
    else kawarp.current?.start();
  }, [ready, reduceMotion]);

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
    <div aria-hidden="true" className="fixed inset-0 -z-10 bg-[oklch(0.1_0.01_270)]">
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
