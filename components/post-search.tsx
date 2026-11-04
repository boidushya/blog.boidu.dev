"use client";

import { setPostSearch, usePostSearch } from "@/utils/post-search";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

const SPRING = { type: "spring", duration: 0.4, bounce: 0 } as const;
const ICON_SPRING = { type: "spring", duration: 0.3, bounce: 0 } as const;
const ICON_HIDDEN = { opacity: 0, scale: 0.25, filter: "blur(4px)" };
const ICON_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const PostSearch = () => {
  const query = usePostSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => setPostSearch(""), []);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0, filter: "blur(4px)" }}
      animate={{ width: "auto", opacity: 1, filter: "blur(0px)" }}
      exit={{ width: 0, opacity: 0, filter: "blur(4px)" }}
      transition={SPRING}
      className="overflow-hidden shrink-0"
    >
      <label className="relative flex items-center mr-2 h-9 rounded-full bg-white/[0.06] text-accent-400 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] transition-[background-color,box-shadow,color] duration-200 ease-out hover:bg-white/[0.09] focus-within:bg-white/[0.1] focus-within:text-accent-200 focus-within:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="absolute w-4 h-4 pointer-events-none left-2.5 translate-y-[1.5px]"
        >
          <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
          <path d="M21 21l-6 -6" />
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
          className="w-9 h-full pl-9 text-[15px] bg-transparent rounded-full outline-none text-accent-100 placeholder:text-transparent placeholder:transition-colors transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] focus:w-40 focus:pr-8 focus:placeholder:text-accent-400/60 [&:not(:placeholder-shown)]:w-40 [&:not(:placeholder-shown)]:pr-8 sm:w-36 sm:pr-8 sm:placeholder:text-accent-400 sm:focus:w-56 sm:focus:placeholder:text-accent-400/60 sm:[&:not(:placeholder-shown)]:w-56 [&::-webkit-search-cancel-button]:hidden"
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
              className="absolute grid w-6 h-6 rounded-full right-1.5 place-items-center text-accent-400 hover:text-accent-200 hover:bg-white/[0.08] transition-colors after:absolute after:-inset-2 after:content-['']"
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
    </motion.div>
  );
};

export default PostSearch;
