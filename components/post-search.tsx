"use client";

import { setPostSearch, usePostSearch } from "@/utils/post-search";
import { useEffect } from "react";

const PostSearch = () => {
  const query = usePostSearch();

  useEffect(() => () => setPostSearch(""), []);

  return (
    <label className="relative flex items-center mr-2 h-9 rounded-full bg-white/[0.06] text-accent-400 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] transition-[background-color,box-shadow] duration-150 hover:bg-white/[0.09] focus-within:bg-white/[0.1] focus-within:text-accent-200 focus-within:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="absolute w-4 h-4 pointer-events-none left-3"
      >
        <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
        <path d="M21 21l-6 -6" />
      </svg>
      <input
        type="search"
        aria-label="Search posts"
        placeholder="Search"
        value={query}
        onChange={e => setPostSearch(e.target.value)}
        onKeyDown={e => e.key === "Escape" && setPostSearch("")}
        data-cuelume-type
        data-cuelume-emphasis="subtle"
        className="w-28 h-full pl-9 pr-3 text-[15px] bg-transparent rounded-full outline-none text-accent-100 placeholder:text-accent-400 transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] focus:w-44 sm:w-36 sm:focus:w-56 [&::-webkit-search-cancel-button]:hidden"
      />
    </label>
  );
};

export default PostSearch;
