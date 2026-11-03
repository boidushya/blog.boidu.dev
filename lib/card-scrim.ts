import fs from "fs";
import { join } from "path";
import sharp from "sharp";

const TARGET_LUMINANCE = 0.05;
const SATURATION = 1.6;
// The lightest scrim color across the dark themes, so the result holds for all of them.
const SCRIM_RGB = [23, 23, 23];

const linear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]: number[]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

// Same matrix as CSS saturate(), which the wash applies on top of the image.
function saturate([r, g, b]: number[], s: number) {
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  return [
    clamp((0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b),
    clamp((0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b),
    clamp((0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b),
  ];
}

async function readImage(src: string) {
  if (src.startsWith("/")) return fs.promises.readFile(join(process.cwd(), "public", src));
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${res.status} fetching ${src}`);
  return Buffer.from(await res.arrayBuffer());
}

// The wash is a heavy blur of the image, so the bright end of a small downsample is a safe upper bound.
async function brightest(src: string) {
  const { data } = await sharp(await readImage(src))
    .resize(24, 14, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels: number[][] = [];
  for (let i = 0; i < data.length; i += 3) pixels.push(saturate([data[i], data[i + 1], data[i + 2]], SATURATION));
  pixels.sort((a, b) => luminance(b) - luminance(a));
  return pixels[Math.floor(pixels.length * 0.05)];
}

const cache = new Map<string, Promise<number>>();

/** Opacity of the dark layer over a card's wash that keeps its translucent white text at 4.5:1 or better. */
export function cardScrim(src: string) {
  let scrim = cache.get(src);
  if (!scrim) {
    scrim = brightest(src)
      .then(rgb => {
        for (let alpha = 0.35; alpha < 0.96; alpha += 0.01) {
          const bg = SCRIM_RGB.map((c, i) => c * alpha + rgb[i] * (1 - alpha));
          if (luminance(bg) <= TARGET_LUMINANCE) return Math.round(alpha * 100) / 100;
        }
        return 0.96;
      })
      .catch(error => {
        console.warn(`Card scrim fell back to the maximum for ${src}:`, error);
        return 0.96;
      });
    cache.set(src, scrim);
  }
  return scrim;
}
