import { clamp01 } from "@/utils/math";

const key = (id: string) => `blog-read:${id}`;

export const getProgress = (id: string) => clamp01(Number(localStorage.getItem(key(id))) || 0);

export function recordProgress(id: string, fraction: number) {
  if (fraction > getProgress(id)) localStorage.setItem(key(id), String(Math.min(1, fraction)));
}

export function pickShuffle(ids: string[], current: string, progress: Record<string, number>, random: number) {
  const others = ids.filter(id => id !== current);
  const unread = others.filter(id => (progress[id] ?? 0) < 1);
  const pool = unread.length ? unread : others;
  return pool[Math.floor(random * pool.length)];
}

export const clock = (minutes: number) => {
  const seconds = Math.round(minutes * 60);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};
