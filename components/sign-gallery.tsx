"use client";

import { useSign } from "@/providers/sign";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";

const containerVariants = {
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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const SignGallery = ({ id }: { id: string }) => {
  const [signs, setSigns] = React.useState<string[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [isEmpty, setIsEmpty] = React.useState(true);

  const { open } = useSign();

  const fetchSigns = async () => {
    const response = await fetch(`/api/sign?id=${id}`);
    const data = await response.json();
    const svgTexts = data.svgTexts as string[];

    if (svgTexts.length === 0) {
      setIsEmpty(true);
    }

    setSigns((prevSigns: string[]) => {
      const uniqueSigns = Array.from(new Set([...prevSigns, ...svgTexts]));
      return Array(8).fill(uniqueSigns).flat();
    });
  };

  React.useEffect(() => {
    fetchSigns();
  }, [id, open]);

  React.useEffect(() => {
    setHasMore(signs.length > 4);
  }, [signs]);

  return (
    <div className="p-4 border border-dashed border-accent-600/50 bg-accent-800/25 rounded-xl">
      <h3 className="flex items-center justify-between gap-2 mb-4 text-lg font-semibold text-accent-400">
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-5 h-5" viewBox="0 0 256 256">
            <path
              fill="currentColor"
              d="M80.3 120.26a58.3 58.3 0 0 1 .7-23.19C83.32 87 87.89 80 92.1 80c2.57 0 2.94.67 3.12 1c.88 1.61 4 10.93-12.63 46.52a29 29 0 0 1-2.29-7.26M232 56v144a16 16 0 0 1-16 16H40a16 16 0 0 1-16-16V56a16 16 0 0 1 16-16h176a16 16 0 0 1 16 16M84 160c2-3.59 3.94-7.32 5.9-11.14c10.34-.32 22.21-7.57 35.47-21.68c5 9.69 11.38 15.25 18.87 16.55c8 1.38 16-2.38 23.94-11.2c6 5.53 16.15 11.47 31.8 11.47a8 8 0 0 0 0-16c-17.91 0-24.3-10.88-24.84-11.86a7.83 7.83 0 0 0-6.54-4.51a8 8 0 0 0-7.25 3.6c-6.78 10-11.87 13.16-14.39 12.73c-4-.69-9.15-10-11.23-18a8 8 0 0 0-14-3c-8.88 10.94-16.3 17.79-22.13 21.66c15.8-35.65 13.27-48.59 9.6-55.3c-1.85-3.48-6.61-9.32-17.1-9.32c-12.44 0-22.42 11-26.69 29.46a75 75 0 0 0-.83 29.81c1.7 8.9 5.17 15.73 10.16 20.12c-3 5.81-6.09 11.43-9 16.61H56a8 8 0 0 0 0 16h.44c-4.26 7.12-7.11 11.59-7.18 11.69a8 8 0 0 0 13.48 8.62c.36-.55 5.47-8.57 12.29-20.31H200a8 8 0 0 0 0-16Z"
            />
          </svg>
          Sign Board
        </span>
        {hasMore && (
          <button
            onClick={() => setHasMore(false)}
            className="flex items-center justify-between h-8 gap-3 px-4 pr-5 text-sm rounded-lg bg-accent-900 hover:bg-accent-800/25"
          >
            Show All
          </button>
        )}
      </h3>
      <hr className="border-dashed border-accent-600/50" />
      {isEmpty ? (
        <p className="flex items-center justify-center w-full h-10 gap-2 mt-4 text-accent-400/50">
          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-5 h-5" viewBox="0 0 256 256">
            <path
              fill="currentColor"
              d="M232 168H63.86c2.66-5.24 5.33-10.63 8-16.11c15 1.65 32.58-8.78 52.66-31.14c5 13.46 14.45 30.93 30.58 31.25c9.06.18 18.11-5.2 27.42-16.37C189.31 143.75 203.3 152 232 152a8 8 0 0 0 0-16c-30.43 0-39.43-10.45-40-16.11a7.67 7.67 0 0 0-5.46-7.75a8.14 8.14 0 0 0-9.25 3.49c-12.07 18.54-19.38 20.43-21.92 20.37c-8.26-.16-16.66-19.52-19.54-33.42a8 8 0 0 0-14.09-3.37c-20.2 25.34-33.74 33.87-42.17 36.08c8.49-18.87 14.83-35.44 18.89-49.39c6.82-23.44 7.32-39.83 1.51-50.1c-3-5.38-9.34-11.8-22.06-11.8c-16.06 0-28.73 15.18-34.77 41.65c-3.59 15.71-4.18 33.21-1.62 48s7.87 25.55 15.59 31.94c-3.73 7.72-7.53 15.26-11.23 22.41H24a8 8 0 0 0 0 16h13.41c-11.32 21-20.12 35.64-20.26 35.88a8 8 0 1 0 13.71 8.24c.15-.26 11.27-18.79 24.7-44.12H232a8 8 0 0 0 0-16M58.74 69.21C62.72 51.74 70.43 40 77.91 40c5.33 0 7.1 1.86 8.13 3.67c3 5.33 6.52 24.19-21.66 86.39c-8.26-11.28-11.07-37.06-5.64-60.85"
            />
          </svg>
          No signs yet! Create one by liking this post.
        </p>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={`grid grid-cols-4 gap-4 overflow-hidden transition-[max-height] duration-500 ${hasMore ? "gradient-mask max-h-24" : "max-h-full"}`}
        >
          <AnimatePresence>
            {signs.map((svgText: string, index: number) => (
              <motion.div
                key={svgText + index}
                variants={itemVariants}
                className="border border-dashed rounded-lg border-accent-600/50 bg-accent-900/50"
                dangerouslySetInnerHTML={{ __html: svgText }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default SignGallery;
