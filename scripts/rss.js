const { promises: fs } = require("fs");
const path = require("path");
const RSS = require("rss");
const matter = require("gray-matter");

async function generate() {
  const feed = new RSS({
    title: "Boidu's Blog",
    site_url: "https://blog.boidu.dev",
    feed_url: "https://blog.boidu.dev/feed.xml",
  });

  const posts = await fs.readdir(path.join(__dirname, "..", "blogs"));

  await Promise.all(
    posts.map(async name => {
      if (name.startsWith("index.")) return;

      const content = await fs.readFile(path.join(__dirname, "..", "blogs", name));
      const frontmatter = matter(content);

      console.log(frontmatter.data.labels);

      feed.item({
        title: frontmatter.data.title,
        url: "/posts/" + name.replace(/\.mdx?/, ""),
        date: frontmatter.data.date,
        description: frontmatter.data.description,
        categories: frontmatter.data.labels,
        author: "Boidushya Bhattacharyay",
      });
    })
  );

  await fs.writeFile("./public/feed.xml", feed.xml({ indent: true }));
}

generate();
