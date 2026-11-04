import fs from "fs";
import { join } from "path";

/** Width and height of an mp4 in `public/`, read from its first video track header (`tkhd`). */
export async function videoSize(src: string) {
  const file = await fs.promises.readFile(join(process.cwd(), "public", src));
  for (let at = file.indexOf("tkhd"); at !== -1; at = file.indexOf("tkhd", at + 4)) {
    const end = at - 4 + file.readUInt32BE(at - 4);
    const width = file.readUInt32BE(end - 8) >>> 16;
    const height = file.readUInt32BE(end - 4) >>> 16;
    if (width && height) return { width, height };
  }
  throw new Error(`No video track size in ${src}`);
}
