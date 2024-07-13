"use client";

import React, { useCallback, useRef } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  motionValue,
  useAnimate,
  ValueAnimationTransition,
  Variants,
} from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { useResizeObserver } from "@/utils/hooks";

const likeCountVariants: Variants = {
  initial: direction => ({
    opacity: 0,
    y: direction > 0 ? 8 : -8,
    scale: 0.75,
  }),
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: direction => ({
    opacity: 0,
    y: direction > 0 ? 8 : -8,
    scale: 0.75,
  }),
};

const likeSvgVariants: Variants = {
  initial: {
    opacity: 0,
    scaleX: 1.25,
    scaleY: 0.75,
  },
  animate: {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
  },
  exit: {
    opacity: 0,
    scaleX: 1.25,
    scaleY: 0.75,
  },
};

const transition: ValueAnimationTransition = {
  type: "spring",
  mass: 0.05,
  damping: 15,
  stiffness: 250,
};

export default function Like({ postId }: { postId: string }) {
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState<number | null>(null);

  const [scope, animate] = useAnimate();

  const onResize = useCallback((target: HTMLButtonElement) => {
    animate(scope.current, { width: target.offsetWidth }, transition);
  }, []);

  const contentRef = useResizeObserver<HTMLButtonElement>(onResize);

  const handleClick = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prevCount => (prevCount !== null ? (newLiked ? prevCount + 1 : Math.max(0, prevCount - 1)) : 0));

    try {
      const response = await fetch(`/api/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: newLiked ? "increment" : "decrement", id: postId }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Error updating likes:", error);

      setLiked(!newLiked);
      setLikeCount(prevCount => (prevCount !== null ? (newLiked ? prevCount - 1 : prevCount + 1) : 0));
    }
  };

  const fetchLikeCount = async () => {
    try {
      const response = await fetch(`/api/like?id=${postId}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setLikeCount(data.count || 0);
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };

  React.useEffect(() => {
    fetchLikeCount();
  }, [postId]);

  return (
    <motion.div
      ref={scope}
      className={`border rounded-full bg-accent-900/50 border-accent-600/50 backdrop-blur hover:bg-accent-850/50 shadow-deep transition-[opacity,transform] ${likeCount === null ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
    >
      <button
        onClick={handleClick}
        ref={contentRef}
        className="flex items-center justify-center gap-2 px-3 py-2 pr-4 text-sm leading-none text-pink-500"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <div key={likeCount} className="relative w-5 h-5">
            {liked ? (
              <motion.svg
                variants={likeSvgVariants}
                custom={liked ? 1 : -1}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="absolute w-5 h-5"
              >
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </motion.svg>
            ) : (
              <motion.svg
                variants={likeSvgVariants}
                custom={liked ? 1 : -1}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="absolute w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </motion.svg>
            )}
          </div>
        </AnimatePresence>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={likeCount ?? "loading"}
            variants={likeCountVariants}
            custom={liked ? 1 : -1}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="font-mono text-accent-200"
          >
            {likeCount ?? 0}
          </motion.p>
        </AnimatePresence>
      </button>
    </motion.div>
  );
}
