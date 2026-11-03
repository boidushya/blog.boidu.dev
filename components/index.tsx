"use client";

import type { BlogCard } from "@/lib/blogs";
import { useTheme } from "@/providers/theme";
import { Tooltip } from "@/utils/components";
import { LIGHT_THEMES } from "@/utils/constants";
import { useWaterMark } from "@/utils/hooks";
import { Kawarp, type KawarpRef } from "@kawarp/react";
import { ToggleGroup, ToggleGroupItem } from "@radix-ui/react-toggle-group";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

function Wash({ src, scrim, isLight }: { src: string; scrim: number; isLight: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const kawarpRef = useRef<KawarpRef>(null);
  const [ready, setReady] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const box = boxRef.current;
    if (!ready || reduceMotion || !box) return;
    const observer = new IntersectionObserver(([entry]) =>
      entry.isIntersecting ? kawarpRef.current?.start() : kawarpRef.current?.stop()
    );
    observer.observe(box);
    return () => {
      observer.disconnect();
      kawarpRef.current?.stop();
    };
  }, [ready, reduceMotion]);

  return (
    <div ref={boxRef} aria-hidden="true" className="absolute inset-0 overflow-hidden -z-10">
      <Image src={src} alt="" fill sizes="128px" className="object-cover scale-[1.4] blur-[48px] saturate-150" />
      <Kawarp
        ref={kawarpRef}
        src={src}
        autoPlay={false}
        blurPasses={8}
        animationSpeed={1.6}
        saturation={1.6}
        warpIntensity={0.9}
        onLoad={() => {
          kawarpRef.current?.instance?.renderFrame();
          setReady(true);
        }}
        style={{ position: "absolute", inset: 0 }}
        className={`transition-opacity duration-[600ms] ease-out ${ready ? "opacity-100" : "opacity-0"}`}
      />
      <div className={`absolute inset-0 ${isLight ? "bg-accent-50" : "bg-accent-900"}`} style={{ opacity: scrim }} />
    </div>
  );
}

export function ContentBox({ post, feature }: { post: BlogCard; feature: boolean }) {
  const { theme } = useTheme();
  const isLight = LIGHT_THEMES.includes(theme);

  return (
    <Link
      href={post.link}
      data-cuelume-navigate
      aria-labelledby={`post-${post.id}-title`}
      className={`enter relative grid grid-rows-[auto_1fr] overflow-hidden isolate shadow-[0_1px_2px_oklch(0_0_0/0.3),0_12px_32px_oklch(0_0_0/0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400 ${
        feature ? "rounded-3xl sm:col-span-2" : "rounded-[20px]"
      }`}
    >
      <Wash src={post.image} scrim={post.scrim} isLight={isLight} />
      <div className="relative aspect-video">
        <Image
          src={post.image}
          alt=""
          fill
          sizes={feature ? "(min-width: 768px) 768px, 100vw" : "(min-width: 768px) 374px, 100vw"}
          priority={feature}
          quality={100}
          className="object-cover"
        />
      </div>
      <div
        className={
          feature
            ? "grid content-start gap-3.5 px-3.5 py-[18px] sm:px-8 sm:pt-6 sm:pb-[30px]"
            : "grid content-start grid-rows-[auto_auto_auto_1fr] gap-3 p-5"
        }
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {(post.draft ? ["Draft", ...post.labels] : post.labels).map(label => (
            <span
              key={label}
              className={`pill inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium leading-none whitespace-nowrap ${
                label === "Draft" && post.draft
                  ? isLight
                    ? "bg-accent-850 text-accent-50"
                    : "bg-accent-100 text-accent-900"
                  : "bg-white/[0.12] text-white/[0.92]"
              }`}
            >
              <span>{label}</span>
            </span>
          ))}
        </div>
        <h3
          id={`post-${post.id}-title`}
          className={`font-semibold tracking-[-0.015em] text-white [text-wrap:balance] ${
            feature ? "text-[22px] leading-[1.2] sm:text-[28px]" : "text-[19px] leading-[1.3]"
          }`}
        >
          {post.title}
        </h3>
        <p
          className={`leading-relaxed text-white/[0.84] [text-wrap:pretty] ${
            feature ? "text-[15px] max-w-[58ch]" : "text-sm line-clamp-2"
          }`}
        >
          {post.description}
        </p>
        <div className={`flex items-center gap-2 text-[13px] text-white/[0.72] ${feature ? "" : "self-end pt-1"}`}>
          <span>{post.date}</span>
          <span aria-hidden="true" className="text-white/40">
            ·
          </span>
          <span>{post.readingTime}</span>
        </div>
      </div>
    </Link>
  );
}

export function View({ data }: { data: BlogCard[] }) {
  useWaterMark();
  const [first, ...rest] = data;

  return (
    <div className="grid w-full gap-5 card-list sm:grid-cols-2">
      {first && <ContentBox key={first.link} post={first} feature />}
      {rest.map(post => (
        <ContentBox key={post.link} post={post} feature={false} />
      ))}
    </div>
  );
}

export const ViewWithUtils = ({ data }: { data: BlogCard[] }) => {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("");
  const [filteredData, setFilteredData] = React.useState(data);

  React.useEffect(() => {
    if (search === "") {
      setFilteredData(data);
      return;
    }
    setFilteredData(
      filteredData.filter(post => {
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
        newFilteredData = [...filteredData].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "dsc":
        newFilteredData = [...filteredData].sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        newFilteredData = data;
        break;
    }

    setFilteredData(newFilteredData);
  }, [sort]);

  const toggleGroupItemClasses =
    "pressable hover:bg-accent-900 text-accent-400 data-[state=on]:bg-accent-800/50 data-[state=on]:text-accent-100 grid w-10 place-items-center bg-accent-900 text-base leading-4 first:rounded-l-md last:rounded-r-md ";

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="enter [--i:1] flex flex-row w-full h-10 gap-4">
        <div className="relative flex-grow">
          <input
            type="search"
            placeholder="e.g. Understanding React Hooks"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-cuelume-type
            data-cuelume-emphasis="subtle"
            className="w-full h-full px-3 transition-colors border rounded-md pl-9 border-accent-800/50 bg-accent-900 focus:outline-0 focus:border-accent-600 focus:ring-transparent placeholder:text-accent-400/50"
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
          className="inline-flex border rounded-md w-fit border-accent-800/50"
          aria-label="Alphabetical Sort"
          data-cuelume-select
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
            aria-label="Sort Descending"
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
