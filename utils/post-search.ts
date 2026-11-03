import { useSyncExternalStore } from "react";

let query = "";
const listeners = new Set<() => void>();

export function setPostSearch(next: string) {
  query = next;
  for (const listener of Array.from(listeners)) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const usePostSearch = () =>
  useSyncExternalStore(
    subscribe,
    () => query,
    () => ""
  );

type Searchable = { title: string; short: string; description: string; labels: string[] };

export const matchesSearch = (post: Searchable, q: string) =>
  [post.title, post.short, post.description, ...post.labels].join(" ").toLowerCase().includes(q.trim().toLowerCase());
