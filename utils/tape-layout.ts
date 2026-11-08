import type { CSSVars } from "@/utils/css-vars";

export type Crease = { tape: 0 | 1; d: string; at: number };
export type Tapes = { style: CSSVars<string>; crease?: Crease };

export function seededRandom(seed: string) {
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
export function swipeTimeAt(progress: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (swipeY(mid) < progress) lo = mid;
    else hi = mid;
  }
  return swipeX((lo + hi) / 2);
}

export function layTapes(seed: string): Tapes {
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
  const style: CSSVars<string> = {};
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
