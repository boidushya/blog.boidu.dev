import assert from "node:assert/strict";
import fs from "node:fs";
import sharp from "sharp";
import { kawarpFrame } from "./kawarp-frame";

// The fixture is real Kawarp in Chrome (page wash settings, renderFrame(12), 1200x630), shrunk to 60x32
const SIZE = { width: 60, height: 32 };
const shrink = (input: Buffer | string) =>
  sharp(input)
    .resize({ ...SIZE, fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();

async function check() {
  const frame = await kawarpFrame(fs.readFileSync("public/intentional-design/banner.png"), 1200, 630);
  const [ours, kawarp] = await Promise.all([shrink(frame), shrink("lib/kawarp-frame.fixture.png")]);
  let diff = 0;
  for (let i = 0; i < ours.length; i++) diff += Math.abs(ours[i] - kawarp[i]);
  const mean = diff / ours.length;
  assert.ok(mean < 2, `CPU frame drifted from Kawarp: mean channel difference ${mean.toFixed(2)} of 255`);
  console.log(`kawarp-frame: matches Kawarp within ${mean.toFixed(2)} of 255`);
}

check();
