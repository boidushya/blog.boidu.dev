import { clamp01 } from "@/utils/math";

const key = (id: string) => `blog-read:${id}`;

export const getProgress = (id: string) => clamp01(Number(localStorage.getItem(key(id))) || 0);

export function recordProgress(id: string, fraction: number) {
  if (fraction > getProgress(id)) localStorage.setItem(key(id), String(clamp01(fraction)));
}

let resumeId: string | undefined;

export function resumeNext(id: string) {
  resumeId = id;
}

/** Consumes the resume intent; a post not started or already finished opens at the top. */
export function takeResume(id: string) {
  const asked = resumeId === id;
  resumeId = undefined;
  const read = asked ? getProgress(id) : 0;
  return read > 0 && read < 1 ? read : undefined;
}

export function pickShuffle(ids: string[], current: string, progress: Record<string, number>, random: number) {
  const others = ids.filter(id => id !== current);
  const unread = others.filter(id => (progress[id] ?? 0) < 1);
  const pool = unread.length ? unread : others;
  return pool[Math.floor(random * pool.length)];
}
