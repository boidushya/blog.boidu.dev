"use client";

import { setPostSearch, usePostSearch } from "@/utils/post-search";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

const ICON_SPRING = { type: "spring", duration: 0.3, bounce: 0 } as const;
const ICON_HIDDEN = { opacity: 0, scale: 0.25, filter: "blur(4px)" };
const ICON_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const PostSearch = () => {
  const query = usePostSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => setPostSearch(""), []);

  return (
    <label className="relative flex items-center mr-4 h-9 rounded-full bg-white/[0.06] text-white/60 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] transition-[background-color,box-shadow,color] duration-200 ease-out hover:bg-white/[0.09] focus-within:bg-white/[0.1] focus-within:text-white/80 focus-within:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="absolute w-4 h-4 pointer-events-none left-2.5"
      >
        <path d="M10.5 2a8.5 8.5 0 1 0 5.262 15.176l3.652 3.652a1 1 0 0 0 1.414-1.414l-3.652-3.652A8.5 8.5 0 0 0 10.5 2M4 10.5a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        aria-label="Search posts"
        placeholder="Search"
        value={query}
        onChange={e => setPostSearch(e.target.value)}
        onKeyDown={e => e.key === "Escape" && setPostSearch("")}
        data-cuelume-type
        data-cuelume-emphasis="subtle"
        className="w-9 h-full pt-px pl-9 text-[15px] leading-[21px] bg-transparent rounded-full outline-none text-white/90 placeholder:text-transparent placeholder:transition-colors transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] focus:w-40 focus:pr-8 focus:placeholder:text-white/40 [&:not(:placeholder-shown)]:w-40 [&:not(:placeholder-shown)]:pr-8 sm:w-[99px] sm:pr-4 sm:focus:pr-8 sm:[&:not(:placeholder-shown)]:pr-8 sm:placeholder:text-white/50 sm:focus:w-56 sm:focus:placeholder:text-white/40 sm:[&:not(:placeholder-shown)]:w-56 [&::-webkit-search-cancel-button]:hidden"
      />
      <AnimatePresence initial={false}>
        {query && (
          <motion.button
            key="clear"
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setPostSearch("");
              inputRef.current?.focus();
            }}
            initial={ICON_HIDDEN}
            animate={ICON_SHOWN}
            exit={ICON_HIDDEN}
            transition={ICON_SPRING}
            data-cuelume-tap
            data-cuelume-emphasis="subtle"
            className="absolute grid w-6 h-6 rounded-full right-1.5 place-items-center text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-colors after:absolute after:-inset-2 after:content-['']"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="w-3.5 h-3.5"
            >
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </label>
  );
};

export default PostSearch;
