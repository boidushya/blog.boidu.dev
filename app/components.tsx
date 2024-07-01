"use client";

import Image from "next/image";
import Link from "next/link";
import React, { PropsWithoutRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWaterMark } from "@/utils/hooks";
import { isYouTubeLink } from "@/utils/functions";
import { ToggleGroup, ToggleGroupItem } from "@radix-ui/react-toggle-group";
import { Toggle } from "@radix-ui/react-toggle";
import { Tooltip } from "@/utils/components";

const getYouTubeThumbnail = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );

  if (match) {
    const videoId = match[1];
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    return thumbnailUrl;
  }

  return null;
};

export function ContentBox({
  id,
  title,
  description,
  image,
  link,
  length,
  labels,
}: {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
  length: number;
  labels: string[];
}) {
  const projectVariants = {
    hidden: {
      opacity: 0,
      y: -20,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const isYoutubeVideo = isYouTubeLink(image);
  const resolvedImage = isYoutubeVideo ? getYouTubeThumbnail(image) : image;
  return (
    <motion.div
      variants={projectVariants}
      className={`rounded-xl shadow-xl overflow-hidden grid items-start self-start justify-start w-full grid-cols-3 border border-opacity-10 border-accent-400 ${
        id !== length ? `border-b` : ``
      }`}
    >
      <div className="relative flex items-start order-2 h-full col-span-1 border-l border-accent-400 border-opacity-10">
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-accent-900/80" />
        <Image
          src={resolvedImage as string}
          fill
          style={{
            objectFit: "cover",
          }}
          alt={title}
          loading="lazy"
        />
      </div>
      <div className="relative flex flex-col items-start justify-between order-1 h-full col-span-2 overflow-hidden tracking-normal isolate">
        <div className="flex flex-row justify-start w-full gap-4 p-8 pb-0">
          {labels.map(label => (
            <span
              key={label}
              className={`bg-accent-800/50 text-accent-50/75 border border-accent-800 px-2 py-1 text-xs text-accent-0 rounded-md`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex flex-col justify-center h-full p-8 pb-12">
          <h3 className="mb-4 text-2xl font-semibold tracking-tight text-accent-50">{title}</h3>
          <p className="text-sm tracking-normal text-accent-50/60">{description}</p>
        </div>
        <Image
          src={resolvedImage as string}
          fill={true}
          alt="Andi"
          className="absolute inset-0 z-[-1] filter blur-3xl object-cover brightness-[33%]"
          loading="lazy"
        />
        <Link
          href={link}
          className="flex items-center justify-start w-full gap-1 px-8 py-4 text-sm font-semibold tracking-wide transition-colors border-t select-none border-accent-400 border-opacity-5 bg-opacity-30 group text-accent-400 bg-accent-800 hover:bg-opacity-50 hover:text-accent-300 hover:border-transparent"
        >
          Read More
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="w-3 h-3 transition-transform group-hover:translate-x-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}

export function View({ data }: { data: any }) {
  const projectContainerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.125,
      },
    },
  };
  useWaterMark();

  return (
    <motion.div
      variants={projectContainerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="w-full space-y-8"
    >
      <AnimatePresence>
        {data.map(
          (
            item: React.JSX.IntrinsicAttributes & {
              id: number;
              title: string;
              description: string;
              image: string;
              link: string;
              labels: string[];
            }
          ) => (
            <ContentBox length={data.length} key={item.id} {...item} />
          )
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const ViewWithUtils = ({ data }: { data: any }) => {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("");
  const [filteredData, setFilteredData] = React.useState(data);

  React.useEffect(() => {
    if (search === "") {
      setFilteredData(data);
      return;
    }
    setFilteredData(
      filteredData.filter((post: any) => {
        const postTitle = post.title.toLowerCase();
        const postDescription = post.description.toLowerCase();
        const postLabels = post.labels.join(" ").toLowerCase();
        const searchValue = search.toLowerCase();
        return (
          postTitle.includes(searchValue) || postDescription.includes(searchValue) || postLabels.includes(searchValue)
        );
      })
    );
  }, [search]);

  React.useEffect(() => {
    let newFilteredData;

    switch (sort) {
      case "asc":
        newFilteredData = [...filteredData].sort((a: any, b: any) => a.title.localeCompare(b.title));
        break;
      case "dsc":
        newFilteredData = [...filteredData].sort((a: any, b: any) => b.title.localeCompare(a.title));
        break;
      default:
        newFilteredData = data;
        break;
    }

    setFilteredData(newFilteredData);
  }, [sort]);

  const toggleGroupItemClasses =
    "hover:bg-accent-900 text-accent-400 data-[state=on]:bg-accent-800/50 data-[state=on]:text-accent-100 grid w-10 place-items-center bg-accent-900 text-base leading-4 first:rounded-l last:rounded-r ";

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex flex-row w-full h-10 gap-4">
        <div className="relative flex-grow">
          <input
            type="search"
            placeholder="e.g. Understanding React Hooks"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-2 px-3 transition-colors border rounded-md pl-9 border-accent-800/50 bg-accent-900 focus:outline-0 focus:border-accent-800 focus:ring-transparent"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-accent-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </div>
        <ToggleGroup
          type="single"
          value={sort}
          onValueChange={setSort}
          className="inline-flex border rounded w-fit border-accent-800/50"
          aria-label="Alphabetical Sort"
        >
          <ToggleGroupItem value="asc" className={toggleGroupItemClasses} aria-label="Sort Ascending">
            <Tooltip content="Sort Ascending">
              <div className="grid w-full h-full place-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                  <g fill="none">
                    <path d="M24 0v24H0V0zM12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036c-.01-.003-.019 0-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"></path>
                    <path
                      fill="currentColor"
                      d="m17.707 4.293l2.829 2.828a1 1 0 0 1-1.415 1.415L18 7.414V20a1 1 0 1 1-2 0V7.414l-1.121 1.122a1 1 0 1 1-1.415-1.415l2.829-2.828a1 1 0 0 1 1.414 0M8 12c.674 0 1.28.396 1.556 1.002l.054.132l2.332 6.53a1 1 0 0 1-1.838.78l-.046-.108L9.581 19H6.419l-.477 1.336a1 1 0 0 1-1.917-.56l.033-.112l2.332-6.53A1.71 1.71 0 0 1 8 12m0 2.573L7.133 17h1.734zM10.759 3c.94 0 1.43 1.092.855 1.792l-.078.086L7.414 9H11a1 1 0 0 1 .117 1.993L11 11H5.241c-.94 0-1.43-1.092-.855-1.792l.078-.086L8.586 5H5a1 1 0 0 1-.117-1.993L5 3z"
                    ></path>
                  </g>
                </svg>
              </div>
            </Tooltip>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="dsc"
            className={`${toggleGroupItemClasses} border-l border-accent-800/50`}
            aria-label="Sort Ascending"
          >
            <Tooltip content="Sort Descending">
              <div className="grid w-full h-full place-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                  <g fill="none">
                    <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"></path>
                    <path
                      fill="currentColor"
                      d="M8 12c.674 0 1.28.396 1.556 1.002l.054.132l2.332 6.53a1 1 0 0 1-1.838.78l-.046-.108L9.581 19H6.419l-.477 1.336a1 1 0 0 1-1.917-.56l.033-.112l2.332-6.53A1.71 1.71 0 0 1 8 12m9-8a1 1 0 0 1 1 1v12.414l1.121-1.121a1 1 0 0 1 1.415 1.414l-2.829 2.828a1 1 0 0 1-1.414 0l-2.828-2.828a1 1 0 0 1 1.414-1.414L16 17.414V5a1 1 0 0 1 1-1M8 14.573L7.133 17h1.734zM10.759 3c.94 0 1.43 1.092.855 1.792l-.078.086L7.414 9H11a1 1 0 0 1 .117 1.993L11 11H5.241c-.94 0-1.43-1.092-.855-1.792l.078-.086L8.586 5H5a1 1 0 0 1-.117-1.993L5 3z"
                    ></path>
                  </g>
                </svg>
              </div>
            </Tooltip>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <View data={filteredData} />
      {data.length !== 0 && filteredData.length === 0 && (
        <div className="flex items-center justify-center w-full h-40 text-accent-800">No results found.</div>
      )}
      {data.length === 0 && (
        <div className="flex items-center justify-center w-full h-40 text-accent-800">Nothing to see here.</div>
      )}
    </div>
  );
};
