import fs from "fs";
import { join } from "path";
import { washDim } from "@/lib/wash-dim";
import { getAuthorsData, getYouTubeThumbnail, isYouTubeLink } from "@/utils/functions";
import { rehypeAdmonitions } from "@/utils/rehype-admonitions";
import rehypeChapterHeading from "@/utils/rehype-chapter-heading";
import rehypeShiki from "@/utils/rehype-shiki";
import rehypeSourceBlocks from "@/utils/rehype-source-blocks";
import rehypeVideo from "@/utils/rehype-video";
import { format } from "date-fns";
import matter from "gray-matter";
import readingTime from "reading-time";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createCssVariablesTheme } from "shiki";
import { type PluggableList, unified } from "unified";

let p: ReturnType<typeof getParserPre> | undefined;

export const remarkPlugins: PluggableList = [remarkGfm];

export const rehypePlugins: PluggableList = [
  rehypeSourceBlocks,
  [rehypeShiki, { theme: createCssVariablesTheme() }],
  rehypeSlug,
  rehypeAdmonitions as any,
  rehypeVideo,
  [
    rehypeAutolinkHeadings,
    {
      behavior: "wrap",
      properties: { className: "heading-anchor" },
    },
  ],
  rehypeChapterHeading,
];

async function getParserPre() {
  return unified().use(remarkParse).use(remarkPlugins).use(remarkRehype).use(rehypePlugins).use(rehypeStringify);
}

function getParser() {
  if (!p) {
    p = getParserPre().catch(e => {
      p = undefined;
      throw e;
    });
  }
  return p;
}

export async function getPostById(id: string) {
  const realId = id.replace(/\.mdx?$/, "");

  let fullPath = join("blogs", `${realId}.mdx`);
  let isMDX = fs.existsSync(fullPath);
  if (!isMDX) {
    fullPath = join("blogs", `${realId}.md`);
  }

  const fileContent = await fs.promises.readFile(fullPath, "utf8");
  const { data, content } = matter(fileContent);

  let html: string;

  if (isMDX) {
    html = content;
  } else {
    const parser = await getParser();
    const processed = await parser.process(content);
    html = processed.value.toString();
  }

  const reading = readingTime(content);
  const authors = data.authors ? getAuthorsData(data.authors) : [];
  const artSource: string = data.cover ?? data.banner;

  return {
    ...data,
    title: data.title,
    short: (data.short as string | undefined) ?? String(data.title).toLowerCase(),
    id: realId,
    banner: data.banner,
    cover: data.cover as string | undefined,
    art: (isYouTubeLink(artSource) && getYouTubeThumbnail(artSource)) || artSource,
    video: data.video as string | undefined,
    description: String(data.description ?? "").trim(),
    date: format(new Date(data.date), "LLL dd, yyyy"),
    publishedAt: new Date(data.date).toISOString(),
    readingTime: reading.text,
    minutes: Math.ceil(Number(reading.minutes.toFixed(2))),
    html,
    isMDX,
    labels: (data.labels ?? []) as string[],
    authors: authors || [],
    draft: data.draft === true,
  };
}

export const isHiddenDraft = (post: { draft?: unknown }) =>
  post.draft === true && process.env.NODE_ENV === "production";

async function getVisiblePosts() {
  const files = fs.readdirSync("blogs").filter(name => /\.mdx?$/.test(name));
  const posts = await Promise.all(files.map(id => getPostById(id)));
  return posts.filter(post => !isHiddenDraft(post));
}

export async function getAllPosts() {
  const posts = await getVisiblePosts();
  return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}

export async function getAllBlogs() {
  const posts = await getVisiblePosts();
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return Promise.all(
    posts.map(async post => ({
      id: post.id,
      title: post.title,
      short: post.short,
      description: post.description,
      image: post.art,
      dim: await washDim(post.art),
      link: `/${post.id}`,
      labels: post.draft ? ["Draft", ...post.labels] : post.labels,
      minutes: post.minutes,
      note: `${format(new Date(post.date), "LLL ''yy").toLowerCase()} · ${post.minutes} min`,
    }))
  );
}

export type BlogCard = Awaited<ReturnType<typeof getAllBlogs>>[number];
