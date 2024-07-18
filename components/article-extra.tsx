"use client";

import SignProvider from "@/providers/sign";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import Like from "./like";
import SignGallery from "./sign-gallery";

const queryClient = new QueryClient();

const ArticleExtra = ({
  id,
}: {
  id: string;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SignProvider>
        <hr className="my-8 border-dashed border-accent-800/50" />
        <SignGallery id={id} />
        <div className="fixed sm:bottom-12 sm:right-12 bottom-4 right-4">
          <Like postId={id} />
        </div>
      </SignProvider>
    </QueryClientProvider>
  );
};

export default ArticleExtra;
