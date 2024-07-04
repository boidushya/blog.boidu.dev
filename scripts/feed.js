const { promises: fs } = require("fs");
const path = require("path");
const { Feed } = require("feed");
const matter = require("gray-matter");

async function generate() {
  const author = {
    name: "Boidushya Bhattacharyay",
    link: "https://boidu.dev",
    email: "hi@boidushya.com",
  };

  const feed = new Feed({
    title: "Boidu's Blog",
    description: "A blog where I write about my thoughts and experiences.",
    id: "https://blog.boidu.dev",
    link: "https://blog.boidu.dev",
    language: "en",
    image: "https://blog.boidu.dev/static/logo.jpg",
    favicon: "https://blog.boidu.dev/static/logo.jpg",
    copyright: `All Rights Reserved ${new Date().getFullYear()} Boidushya Bhattacharyay`,
    updated: new Date(),
    feedLinks: {
      atom: "https://blog.boidu.dev/atom.xml",
      json: "https://blog.boidu.dev/feed.json",
      rss: "https://blog.boidu.dev/rss.xml",
    },
    author,
  });

  const posts = await fs.readdir(path.join(__dirname, "..", "blogs"));

  await Promise.all(
    posts.map(async name => {
      if (name.startsWith("index.")) return;

      const content = await fs.readFile(path.join(__dirname, "..", "blogs", name));
      const frontmatter = matter(content);

      const url = `https://blog.boidu.dev/posts/${name.replace(/\.mdx?/, "")}`;

      feed.addItem({
        title: frontmatter.data.title,
        id: url,
        link: url,
        date: new Date(frontmatter.data.date),
        description: frontmatter.data.description,
        image: frontmatter.data.banner,
        category: frontmatter.data.labels.map(label => ({ name: label })),
        author,
      });
    })
  );

  await fs.writeFile("./public/rss.xml", feed.rss2());
  await fs.writeFile("./public/feed.json", feed.json1());
  await fs.writeFile("./public/atom.xml", feed.atom1());
}

generate();
