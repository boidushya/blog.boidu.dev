import { Player } from "@/components/player";
import { getAllBlogs } from "@/lib/blogs";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  return <Player posts={await getAllBlogs()} />;
}
