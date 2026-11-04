import { WASH_KAWARP } from "@/utils/constants";
import sharp from "sharp";

// Kawarp's own defaults for what the page wash leaves unset
const BLUR_SIZE = 128;
const TINT: [number, number, number] = [0.157, 0.157, 0.235];
const TINT_INTENSITY = 0.15;
const DITHERING = 0.008;
const FRAME_TIME = 12;

type Texture = { size: number; data: Float32Array };

function sample(tex: Texture, u: number, v: number, out: Float32Array) {
  const { size, data } = tex;
  const x = Math.min(Math.max(u * size - 0.5, 0), size - 1);
  const y = Math.min(Math.max(v * size - 0.5, 0), size - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, size - 1);
  const y1 = Math.min(y0 + 1, size - 1);
  const fx = x - x0;
  const fy = y - y0;
  for (let c = 0; c < 3; c++) {
    const a = data[(y0 * size + x0) * 3 + c];
    const b = data[(y0 * size + x1) * 3 + c];
    const d = data[(y1 * size + x0) * 3 + c];
    const e = data[(y1 * size + x1) * 3 + c];
    out[c] = (a + (b - a) * fx) * (1 - fy) + (d + (e - d) * fx) * fy;
  }
}

function tint(tex: Texture) {
  const { data } = tex;
  for (let i = 0; i < data.length; i += 3) {
    const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const t = Math.min(Math.max(luma / 0.5, 0), 1);
    const dark = (1 - t * t * (3 - 2 * t)) * TINT_INTENSITY;
    for (let c = 0; c < 3; c++) data[i + c] += (TINT[c] - data[i + c]) * dark;
  }
}

function kawase(tex: Texture, offset: number): Texture {
  const { size } = tex;
  const data = new Float32Array(tex.data.length);
  const texel = offset / size;
  const tap = new Float32Array(3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const i = (y * size + x) * 3;
      for (const [du, dv] of [
        [-texel, -texel],
        [texel, -texel],
        [-texel, texel],
        [texel, texel],
      ]) {
        sample(tex, u + du, v + dv, tap);
        data[i] += tap[0] / 4;
        data[i + 1] += tap[1] / 4;
        data[i + 2] += tap[2] / 4;
      }
    }
  }
  return { size, data };
}

const mod289 = (x: number) => x - Math.floor(x / 289) * 289;
const permute = (x: number) => mod289((x * 34 + 1) * x);
const fract = (x: number) => x - Math.floor(x);

// Ashima simplex noise, as in Kawarp's warp shader
function snoise(vx: number, vy: number) {
  const C = [0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439];
  const s = (vx + vy) * C[1];
  let ix = Math.floor(vx + s);
  let iy = Math.floor(vy + s);
  const t = (ix + iy) * C[0];
  const x0 = vx - ix + t;
  const y0 = vy - iy + t;
  const i1x = x0 > y0 ? 1 : 0;
  const i1y = 1 - i1x;
  const x1 = x0 + C[0] - i1x;
  const y1 = y0 + C[0] - i1y;
  const x2 = x0 + C[2];
  const y2 = y0 + C[2];
  ix = mod289(ix);
  iy = mod289(iy);
  const p = [permute(permute(iy) + ix), permute(permute(iy + i1y) + ix + i1x), permute(permute(iy + 1) + ix + 1)];
  const corners = [
    [x0, y0],
    [x1, y1],
    [x2, y2],
  ];
  let sum = 0;
  for (let k = 0; k < 3; k++) {
    const [cx, cy] = corners[k];
    let m = Math.max(0.5 - (cx * cx + cy * cy), 0);
    m *= m;
    m *= m;
    const gx = 2 * fract(p[k] * C[3]) - 1;
    const h = Math.abs(gx) - 0.5;
    const a0 = gx - Math.floor(gx + 0.5);
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    sum += m * (a0 * cx + h * cy);
  }
  return 130 * sum;
}

function hash(x: number, y: number, z: number) {
  let px = fract(x * 0.1031);
  let py = fract(y * 0.1031);
  let pz = fract(z * 0.1031);
  const d = px * (pz + 31.32) + py * (py + 31.32) + pz * (px + 31.32);
  px += d;
  py += d;
  pz += d;
  return fract((px + py) * pz);
}

/** One still frame of the page wash (Kawarp) for `image`, rendered on the CPU so the build needs no browser. */
export async function kawarpFrame(image: Buffer, width: number, height: number) {
  const raw = await sharp(image)
    .resize(BLUR_SIZE, BLUR_SIZE, { fit: "fill" })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer();
  let tex: Texture = { size: BLUR_SIZE, data: Float32Array.from(raw, value => value / 255) };
  tint(tex);
  for (let i = 0; i < WASH_KAWARP.blurPasses; i++) tex = kawase(tex, i + 0.5);

  const out = Buffer.alloc(width * height * 3);
  const t = FRAME_TIME * 0.05;
  const color = new Float32Array(3);
  for (let row = 0; row < height; row++) {
    // Kawarp uploads the image unflipped and draws bottom-up, so its frame is upside down; match it
    const yb = height - 1 - row;
    const v = (yb + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const cx = u - 0.5;
      const cy = v - 0.5;
      const r = Math.min(Math.hypot(cx, cy) / 0.7, 1);
      const weight = 1 - r * r * (3 - 2 * r);
      const n1 = snoise(u * 0.35 + t, v * 0.35 + t * 0.7);
      const n2 = snoise(u * 0.35 - t * 0.8 + 50, v * 0.35 + t * 0.5 + 50);
      const n3 = snoise(u * 0.9 + t * 1.2 + 100, v * 0.9 - t);
      const n4 = snoise(u * 0.9 - t, v * 0.9 + t * 1.1 + 100);
      const wu = Math.min(Math.max(u + (n1 * 0.65 + n3 * 0.35) * weight * WASH_KAWARP.warpIntensity, 0), 1);
      const wv = Math.min(Math.max(v + (n2 * 0.65 + n4 * 0.35) * weight * WASH_KAWARP.warpIntensity, 0), 1);
      sample(tex, wu, wv, color);

      const vignette = 1 - (cx * cx + cy * cy) * 0.3;
      const gray = (color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114) * vignette;
      const dither = (hash(x, yb, Math.floor(FRAME_TIME * 60)) - 0.5) * DITHERING;
      const i = (row * width + x) * 3;
      for (let c = 0; c < 3; c++) {
        const value = gray + (color[c] * vignette - gray) * WASH_KAWARP.saturation + dither;
        out[i + c] = Math.round(Math.min(Math.max(value, 0), 1) * 255);
      }
    }
  }
  return sharp(out, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}
