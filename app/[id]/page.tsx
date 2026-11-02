import logo from "@/assets/images/logo.jpg";
import ArticleExtra from "@/components/article-extra";
import InlineEditor from "@/components/inline-editor";
import Like from "@/components/like";
import Sign from "@/components/sign";
import SignGallery from "@/components/sign-gallery";
/* eslint-disable @next/next/no-img-element */
import { getAllPosts, getPostById, isHiddenDraft, rehypePlugins, remarkPlugins } from "@/lib/blogs";
import { mdxComponents } from "@/lib/mdx-components";
import { FadeInImage } from "@/utils/components";
import { IS_DEV } from "@/utils/constants";
import { getAuthorsData, isYouTubeLink, truncate } from "@/utils/functions";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import { notFound } from "next/navigation";
import React from "react";

function YoutubeEmbed({ url }: { url: string }) {
  const matchResult = url.match(
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );

  const videoId = matchResult ? matchResult[1] : null;

  return (
    <iframe
      width="768"
      height="432"
      className="mt-4 mb-10"
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube Video Embed"
      frameBorder="0"
      allowFullScreen
    ></iframe>
  );
}

export default async function Post({
  params: { id },
}: {
  params: { id: string };
}) {
  const post = await getPostById(id);
  if (isHiddenDraft(post)) notFound();
  const { html, title, date, readingTime, banner, authors, isMDX } = post;

  const isYoutubeVideo = isYouTubeLink(banner);

  return (
    <>
      <article className="blog">
        <div className="grid place-items-center">
          {post.draft === true && (
            <span className="px-2 py-1 mt-6 text-xs border rounded-md bg-accent-800/50 text-accent-50/75 border-accent-800">
              Draft
            </span>
          )}
          <h1 className="!mb-2 !mt-6 text-center">{title}</h1>
          <div className="flex items-center justify-center w-full py-3 border-y blog__meta border-accent-800/50">
            <div className="flex mr-4 -space-x-2 rtl:space-x-reverse shrink-0">
              <Image
                src={logo}
                placeholder="blur"
                alt="Boidu's Logo"
                className="w-8 h-8 border rounded-full border-accent-600"
              />
              {authors.map(item => (
                <Image
                  key={item.name}
                  src={item.logo}
                  width={32}
                  height={32}
                  alt="Boidu's Logo"
                  className="w-8 h-8 border rounded-full border-accent-600"
                />
              ))}
            </div>
            <div className="text-accent-300">
              <span className="mr-1">
                Published by <span className="text-accent-50">Boidushya</span>
                {authors &&
                  authors.map((author, index) => {
                    if (index === authors.length - 1) {
                      return (
                        <React.Fragment key={author.name}>
                          {" "}
                          & <span className="text-accent-50">{author.name}</span>
                        </React.Fragment>
                      );
                    }
                    return (
                      <React.Fragment key={author.name}>
                        , <span className="text-accent-50">{author.name}</span>
                      </React.Fragment>
                    );
                  })}
              </span>
              <span className="mx-1">
                <span className="whitespace-pre opacity-50"> · </span>{" "}
                <span className="tabular-nums">{readingTime}</span>
              </span>
              <span className="ml-1">
                <span className="whitespace-pre opacity-50"> · </span> {date}
              </span>
            </div>
          </div>
        </div>
        {isYoutubeVideo ? (
          <YoutubeEmbed url={banner} />
        ) : (
          <FadeInImage
            src={banner}
            alt="Banner"
            height={900}
            width={1600}
            quality={100}
            className="mt-4 mb-10 rounded-lg"
          />
        )}

        {isMDX ? (
          <main className="text-lg leading-[1.7]">
            {/* @ts-expect-error Async Server Component */}
            <MDXRemote
              source={html}
              components={mdxComponents}
              options={{
                mdxOptions: { remarkPlugins, rehypePlugins },
              }}
            />
          </main>
        ) : (
          <main className="text-lg leading-[1.7]" dangerouslySetInnerHTML={{ __html: html as string }} />
        )}
      </article>
      <ArticleExtra id={id} />
      {IS_DEV && <InlineEditor id={id} />}
    </>
  );
}

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map(post => ({
    id: post.id,
  }));
}

export async function generateMetadata({
  params: { id },
}: {
  params: { id: string };
}) {
  const { title, description, banner } = await getPostById(id);

  const processedDescription = truncate(description, 160);

  return {
    title,
    description: processedDescription,
    openGraph: {
      title,
      description: processedDescription,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://blog.boidu.dev"}/${id}`,
      siteName: "blog.boidu.dev",
      images: [
        {
          url: banner,
          width: 1200,
          height: 675,
          alt: title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: processedDescription,
      images: [banner],
    },
  };
}
