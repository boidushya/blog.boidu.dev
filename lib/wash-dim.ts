import fs from "fs";
import { join } from "path";
import sharp from "sharp";

const TARGET_LUMINANCE = 0.2;
const MIN_DIM = 0.1;
const MAX_DIM = 0.7;

async function readImage(src: string) {
  if (src.startsWith("/")) return fs.promises.readFile(join(process.cwd(), "public", src));
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${res.status} fetching ${src}`);
  return Buffer.from(await res.arrayBuffer());
}

async function averageLuminance(src: string) {
  const data = await sharp(await readImage(src))
    .resize(8, 5, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
  let sum = 0;
  for (let i = 0; i < data.length; i += 3)
    sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
  return sum / (data.length / 3);
}

const cache = new Map<string, Promise<number>>();

/** How much to darken a wash of `src` so every washed page lands at about the same lightness, pale banners included. */
export function washDim(src: string) {
  let dim = cache.get(src);
  if (!dim) {
    dim = averageLuminance(src)
      .then(lum => Math.min(MAX_DIM, Math.max(MIN_DIM, 1 - TARGET_LUMINANCE / Math.max(lum, 0.01))))
      .catch(error => {
        console.warn(`Wash dim fell back to the maximum for ${src}:`, error);
        return MAX_DIM;
      });
    cache.set(src, dim);
  }
  return dim;
}
