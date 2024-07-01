import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@/utils/rehype-shiki";
import { format } from "date-fns";
import readingTime from "reading-time";
import { rehypeAdmonitions } from "@/utils/rehype-admonitions";

let p: ReturnType<typeof getParserPre> | undefined;

async function getParserPre() {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(remarkGfm)
    .use(rehypeShiki, {
      theme: "tokyo-night",
    })
    .use(rehypeStringify)
    .use(rehypeSlug)
    .use(rehypeAdmonitions as any)
    .use(rehypeAutolinkHeadings, {
      content: arg => ({
        type: "element",
        tagName: "a",
        properties: {
          href: "#" + arg.properties?.id,
          className: "heading-anchor",
        },
        children: [{ type: "text", value: "#" }],
      }),
    });
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
  const realId = id.replace(/\.md$/, "");
  const fullPath = join("blogs", `${realId}.md`);
  const { data, content } = matter(await fs.promises.readFile(fullPath, "utf8"));

  const parser = await getParser();
  const html = await parser.process(content);

  return {
    ...data,
    title: data.title,
    id: realId,
    banner: data.banner,
    description: data.description,
    date: format(new Date(data.date), "LLL dd, yyyy"),
    readingTime: readingTime(content).text,
    html: html.value.toString(),
    labels: data.labels || [],
  };
}

export async function getAllPosts() {
  const posts = await Promise.all(fs.readdirSync("blogs").map(id => getPostById(id)));
  return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}

export async function getAllBlogs() {
  const posts = await Promise.all(fs.readdirSync("blogs").map(id => getPostById(id)));
  // sort the posts by date
  return posts
    .sort((post1, post2) => {
      const date1 = new Date(post1.date);
      const date2 = new Date(post2.date);
      return date2.getTime() - date1.getTime();
    })
    .map((post, index) => {
      return {
        id: index + 1,
        title: post.title,
        description: post.description,
        image: post.banner,
        link: `/${post.id}`,
        labels: post.labels,
      };
    });
}
