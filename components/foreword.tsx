"use client";

import { Handwriting } from "@/components/handwriting";
import { observeReveal } from "@/utils/reveal";
import type React from "react";
import { type CSSProperties, type RefObject, useEffect, useRef, useState } from "react";

type Crease = { tape: 0 | 1; d: string; at: number };
type CustomStyle = CSSProperties & Record<`--${string}`, string>;
type Tapes = { style: CustomStyle; crease?: Crease };

function seededRandom(seed: string) {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bezier = (p1: number, p2: number) => (t: number) =>
  3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3;
const swipeX = bezier(0.45, 0.15);
const swipeY = bezier(0, 1);

/** Fraction of the press swipe's duration (cubic-bezier(0.45, 0, 0.15, 1)) at which it reaches `progress`. */
function swipeTimeAt(progress: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (swipeY(mid) < progress) lo = mid;
    else hi = mid;
  }
  return swipeX((lo + hi) / 2);
}

function layTapes(seed: string): Tapes {
  const random = seededRandom(seed);
  const jitter = (base: number, spread: number) => base + (random() * 2 - 1) * spread;
  const leftAt = jitter(200, 60);
  const rotations = [jitter(-4, 1.5), jitter(3, 1.5)];
  const at = [Math.round(leftAt), Math.round(leftAt + jitter(420, 90))];
  const press: number[] = [];
  const swipe: number[] = [];
  for (let i = 0; i < 2; i++) {
    press.push(Math.round(jitter(520, 140)));
    swipe.push(Math.round(jitter(560, 90)));
  }
  const style: CustomStyle = {};
  for (let i = 0; i < 2; i++) {
    style[`--t${i + 1}-rot`] = `${rotations[i].toFixed(2)}deg`;
    style[`--t${i + 1}-at`] = `${at[i]}ms`;
    style[`--t${i + 1}-press`] = `${press[i]}ms`;
    style[`--t${i + 1}-swipe`] = `${swipe[i]}ms`;
  }
  if (random() < 0.5) return { style };

  const tape = random() < 0.5 ? 0 : 1;
  const f = jitter(0.6, 0.14);
  const x = tape === 1 ? 96 - f * 96 : f * 96;
  const tilt = jitter(0, 3);
  const points: [number, number][] = [];
  for (let y = -1; y <= 27; y += jitter(3.6, 1)) points.push([x + tilt * (y / 26) + jitter(0, 0.9), y]);
  points.push([x + tilt, 27]);
  const d = `M${points.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(" L")}`;
  const creaseAt = Math.round(at[tape] + press[tape] + swipeTimeAt((f + 0.25) / 1.5) * swipe[tape]);
  return { style, crease: { tape, d, at: creaseAt } };
}

function useRevealed(ref: RefObject<HTMLElement | null>, amount: number) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    return observeReveal(ref.current, amount, () => setShown(true));
  }, [ref, amount]);
  return shown;
}

function Signature({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRevealed(ref, 0.6);
  return (
    <div ref={ref} role="img" aria-label={name} className="foreword-sig" data-shown={shown || undefined}>
      <Handwriting
        text={name}
        delay={0.1}
        shown={shown}
        className="foreword-sig-name"
        onTimed={end => ref.current?.style.setProperty("--ink-end", `${Math.round(end * 1000)}ms`)}
      />
      <svg viewBox="0 0 120 18" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength={1} d="M2 12 C30 6 70 4 118 9 C90 10 60 13 40 16" />
      </svg>
    </div>
  );
}

export function Foreword({
  outro,
  signer,
  seed,
  children,
}: {
  outro: string;
  signer: string;
  seed: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const outroRef = useRef<HTMLParagraphElement>(null);
  const outroShown = useRevealed(outroRef, 0.6);
  const [labelledBy, setLabelledBy] = useState<string>();
  const [taped, setTaped] = useState(false);
  const { style, crease } = layTapes(seed);
  const creaseStyle: CustomStyle | undefined = crease && { "--d": `${crease.at}ms` };

  useEffect(() => {
    const sheet = ref.current;
    if (!sheet) return;
    setLabelledBy(sheet.querySelector("h2")?.id || undefined);
    let cancelled = false;
    const entrance = sheet
      .getAnimations({ subtree: true })
      .filter(animation => animation instanceof CSSAnimation && animation.animationName.startsWith("enter-"));
    Promise.allSettled(entrance.map(animation => animation.finished)).then(() => {
      if (!cancelled) setTaped(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      ref={ref}
      className="foreword enter"
      data-wide
      data-taped={taped || undefined}
      aria-labelledby={labelledBy}
      style={style}
    >
      {([0, 1] as const).map(tape => (
        <span key={tape} className={`foreword-tape foreword-tape-${tape === 0 ? "l" : "r"}`} aria-hidden="true">
          <svg viewBox="0 0 96 26" preserveAspectRatio="none">
            {crease?.tape === tape &&
              ["foreword-crease-hi", "foreword-crease-lo"].map(className => (
                <path key={className} className={className} pathLength={1} d={crease.d} style={creaseStyle} />
              ))}
          </svg>
        </span>
      ))}
      {children}
      <p ref={outroRef} className="foreword-outro">
        <Handwriting text={outro} delay={0.1} shown={outroShown} />
      </p>
      <Signature name={signer} />
    </section>
  );
}

export function Byline({
  name,
  href,
  color,
  children,
}: {
  name: string;
  href: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="byline">
      <a className="byline-avatar" href={href} tabIndex={-1} aria-hidden="true" style={{ background: color }} />
      <div>
        <a className="byline-name" href={href}>
          {name}
        </a>
        <div className="byline-role">{children}</div>
      </div>
    </div>
  );
}
