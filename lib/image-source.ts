import fs from "fs";
import { join } from "path";

const FETCH_TIMEOUT_MS = 10_000;

/** Reads an image that lives in `public/` (a `/path`) or at a remote URL. */
export async function readImage(src: string) {
  if (src.startsWith("/")) return fs.promises.readFile(join(process.cwd(), "public", src));
  const res = await fetch(src, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} fetching ${src}`);
  return Buffer.from(await res.arrayBuffer());
}
