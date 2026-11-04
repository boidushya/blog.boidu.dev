import { Player } from "@/components/player";
import { getAllBlogs } from "@/lib/blogs";

export default async function Home() {
  return <Player posts={await getAllBlogs()} />;
}
