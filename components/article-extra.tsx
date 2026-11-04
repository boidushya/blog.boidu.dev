"use client";

import SignProvider from "@/providers/sign";
import { SCROLL_INTENT_PX, watchScroll } from "@/utils/scroll-intent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useRef } from "react";
import Like from "./like";
import SignGallery from "./sign-gallery";

const queryClient = new QueryClient();
const END_PX = 120;

function useScrollAway() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dock = ref.current;
    if (!dock) return;
    return watchScroll((y, dy) => {
      const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - END_PX;
      if (atEnd || dy < -SCROLL_INTENT_PX) dock.removeAttribute("data-away");
      else if (dy > SCROLL_INTENT_PX) dock.setAttribute("data-away", "");
    });
  }, []);

  return ref;
}

const ArticleExtra = ({
  id,
}: {
  id: string;
}) => {
  const likeRef = useScrollAway();

  return (
    <QueryClientProvider client={queryClient}>
      <SignProvider>
        <hr className="my-8 border-dashed border-accent-800/50" />
        <SignGallery id={id} />
        <div ref={likeRef} className="like-dock fixed sm:bottom-12 sm:right-12 bottom-4 right-4">
          <Like postId={id} />
        </div>
      </SignProvider>
    </QueryClientProvider>
  );
};

export default ArticleExtra;
