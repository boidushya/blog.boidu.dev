import ArticleExtra from "@/components/article-extra";
import { ChapterRail } from "@/components/chapter-rail";
import { GreetingAvatar } from "@/components/greeting-avatar";
import InlineEditor from "@/components/inline-editor";
import Like from "@/components/like";
import { PostVideos } from "@/components/post-videos";
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

const POST_BODY_CLASS = "post-body text-[1.0625rem]/[1.65] sm:text-lg/[1.65]";

function YoutubeEmbed({ url }: { url: string }) {
  const matchResult = url.match(
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );

  const videoId = matchResult ? matchResult[1] : null;

  return (
    <iframe
      width="768"
      height="432"
      className="mb-8 sm:mt-4 sm:mb-10"
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube Video Embed"
      frameBorder="0"
      allowFullScreen
    ></iframe>
  );
}

export default async function Post({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (isHiddenDraft(post)) notFound();
  const { html, title, date, readingTime, banner, authors, isMDX } = post;

  const isYoutubeVideo = isYouTubeLink(banner);

  return (
    <>
      <article className="blog">
        <div className="grid place-items-center">
          {post.draft && (
            <span className="px-2 py-1 mt-6 text-xs border rounded-md bg-accent-800/50 text-fg-muted border-accent-800">
              Draft
            </span>
          )}
          <h1 className="enter !mt-2 !mb-0 sm:!mt-6 sm:!mb-2 text-center">{title}</h1>
          <div className="enter [--i:1] flex items-center justify-center w-full py-3 border-y blog__meta border-accent-800/50">
            <div className="flex mr-3 sm:mr-4 -space-x-2 rtl:space-x-reverse shrink-0">
              <GreetingAvatar />
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
            <div className="flex flex-col min-w-0 sm:flex-row sm:flex-wrap sm:items-center text-accent-300">
              <span className="whitespace-nowrap">
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
              <span className="whitespace-nowrap">
                <span aria-hidden="true" className="mx-1.5 text-fg-faint max-sm:hidden">
                  ·
                </span>
                {readingTime}
                <span aria-hidden="true" className="mx-1.5 text-fg-faint">
                  ·
                </span>
                {date}
              </span>
            </div>
          </div>
        </div>
        <div className="enter [--i:2]">
          {isYoutubeVideo ? (
            <YoutubeEmbed url={banner} />
          ) : (
            <FadeInImage
              src={banner}
              alt="Banner"
              height={900}
              width={1600}
              quality={100}
              className="mb-8 rounded-lg sm:mt-4 sm:mb-10"
            />
          )}
        </div>

        <PostVideos />
        {isMDX ? (
          <ChapterRail>
            <div className={POST_BODY_CLASS}>
              <MDXRemote
                source={html}
                components={mdxComponents}
                options={{
                  mdxOptions: { remarkPlugins, rehypePlugins },
                }}
              />
            </div>
          </ChapterRail>
        ) : (
          <div className={POST_BODY_CLASS} dangerouslySetInnerHTML={{ __html: html as string }} />
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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, description, banner, cover } = await getPostById(id);
  const image = cover ?? banner;

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
          url: image,
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
      images: [image],
    },
  };
}
