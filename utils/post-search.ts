import { createStore } from "@/utils/store";

const query = createStore("");

export const setPostSearch = query.set;
export const usePostSearch = query.use;

type Searchable = { title: string; short: string; description: string; labels: string[] };

export const matchesSearch = (post: Searchable, q: string) =>
  [post.title, post.short, post.description, ...post.labels].join(" ").toLowerCase().includes(q.trim().toLowerCase());
