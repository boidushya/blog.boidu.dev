export type Dot = { cx: number; cy: number; r: number };

export type Signature = { paths: string[]; dots: Dot[] };

export const SIGNATURE_VIEWBOX = "0 0 250 100";

const MAX_POINTS = 20000;

const round = (value: string) => String(Math.round(Number(value) * 10) / 10);

const PATH_DATA = /^[MLCQ0-9.,\s-]+$/;

function compactPath(d: string) {
  if (!PATH_DATA.test(d)) return null;
  return d
    .replace(/-?\d*\.?\d+/g, round)
    .replace(/\s*,\s*/g, ",")
    .replace(/\s*([MLCQ])\s*/g, "$1")
    .trim();
}

const attribute = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

export function parseSignature(svgText: string): Signature | null {
  const paths: string[] = [];
  for (const tag of svgText.match(/<path\b[^>]*>/g) ?? []) {
    const d = attribute(tag, "d");
    const compact = d === undefined ? null : compactPath(d);
    if (!compact) return null;
    paths.push(compact);
  }

  const dots: Dot[] = [];
  for (const tag of svgText.match(/<circle\b[^>]*>/g) ?? []) {
    const [cx, cy, r] = ["cx", "cy", "r"].map(name => Number(attribute(tag, name)));
    if (![cx, cy, r].every(Number.isFinite)) return null;
    dots.push({ cx: Number(round(String(cx))), cy: Number(round(String(cy))), r: Number(round(String(r))) });
  }

  const points = paths.reduce((total, d) => total + d.split(",").length, dots.length);
  if (points === 0 || points > MAX_POINTS) return null;
  return { paths, dots };
}

export function toSvg({ paths, dots }: Signature) {
  const strokes = paths.map(d => `<path d="${d}"/>`).join("");
  const points = dots.map(({ cx, cy, r }) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SIGNATURE_VIEWBOX}">${strokes}${points}</svg>`;
}
