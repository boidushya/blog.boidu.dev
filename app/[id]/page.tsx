/* eslint-disable @next/next/no-img-element */
import { getPostById, getAllPosts } from "@/lib/blogs";
import logo from "@/assets/images/logo.jpg";
import Image from "next/image";
import { FadeInImage } from "@/utils/components";
import { isYouTubeLink, truncate } from "@/utils/functions";

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
  const { html, title, date, readingTime, banner } = await getPostById(id);

  const isYoutubeVideo = isYouTubeLink(banner);

  return (
    <article className="pt-[104px] blog">
      <div className="grid place-items-center">
        <h1 className="!mb-2 !mt-6 text-center">{title}</h1>
        <h6 className="flex items-center justify-center w-full py-3 border-y blog__meta border-accent-800/50">
          <Image
            src={logo}
            placeholder="blur"
            alt="Boidu's Logo"
            className="w-8 h-8 mr-4 border rounded-full border-accent-600"
          />
          <div className="text-accent-300">
            <span className="mr-1">
              Published by{" "}
              <span className="text-accent-50">Boidushya Bhattacharyay</span>
            </span>
            <span className="mx-1">
              <span className="whitespace-pre opacity-50"> • </span>{" "}
              {readingTime}
            </span>
            <span className="ml-1">
              <span className="whitespace-pre opacity-50"> • </span> {date}
            </span>
          </div>
        </h6>
      </div>
      {isYoutubeVideo ? (
        <YoutubeEmbed url={banner} />
      ) : (
        <FadeInImage
          src={banner}
          alt="Banner"
          height={900}
          width={1600}
          className="mt-4 mb-10 rounded-lg"
        />
      )}

      <main
        className="text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html as string }}
      />
    </article>
  );
}

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    id: post.id,
  }));
}

export async function generateMetadata({
  params: { id },
}: {
  params: { id: string };
}) {
  const { title, description, banner } = await getPostById(id);

  const processedDescription = truncate(description, 160) + " | blog.boidu.dev";

  return {
    title,
    description: processedDescription,
    image: banner,
  };
}
