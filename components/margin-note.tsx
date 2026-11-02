"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Caveat } from "next/font/google";
import React from "react";

const handwriting = Caveat({ subsets: ["latin"], weight: "400" });

const BRACKET_PATH = "M2 2.5 C5 1.8 8 1.6 10.5 2 C10.2 30 10.9 70 10.4 98 C7.5 98.6 4.5 98.4 1.5 98.9";

export function MarginNote({ note, children }: { note: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const draw = !reduceMotion;

  return (
    <motion.div
      className="relative"
      initial={draw ? "hidden" : false}
      whileInView="shown"
      viewport={{ once: true, amount: 0.6 }}
    >
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 12 100"
        preserveAspectRatio="none"
        className="absolute top-0 bottom-0 hidden w-3 h-full xl:block left-[calc(100%+1.25rem)] text-accent-400"
        fill="none"
      >
        <motion.path
          d={BRACKET_PATH}
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1 } }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </svg>
      <motion.span
        className={`${handwriting.className} block -mt-3 mb-6 text-right text-2xl leading-none text-accent-400 -rotate-2 xl:absolute xl:m-0 xl:top-1/2 xl:-translate-y-1/2 xl:left-[calc(100%+3rem)] xl:w-44 xl:text-left`}
        variants={{ hidden: { clipPath: "inset(0 100% 0 0)" }, shown: { clipPath: "inset(0 0% 0 0)" } }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.45 }}
      >
        {note}
      </motion.span>
    </motion.div>
  );
}
