import { WASH_KAWARP } from "@/utils/constants";
import { frame } from "@kawarp/core/frame";
import sharp from "sharp";

/** One still frame of the page wash (Kawarp) for `image`, rendered on the CPU so the build needs no browser. */
export async function kawarpFrame(image: Buffer, width: number, height: number) {
  const { data, info } = await sharp(image)
    .removeAlpha()
    .ensureAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = frame(data, info.width, info.height, width, height, WASH_KAWARP);
  return sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}
