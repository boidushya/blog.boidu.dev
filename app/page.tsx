import React from "react";
import { getAllBlogs } from "@/lib/blogs";
import { View, ViewWithUtils } from "./components";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export default async function Home() {
  const data = await getAllBlogs();
  return (
    <main className="flex flex-col items-center py-32 pt-[104px]">
      <h1 className="flex flex-col items-start justify-between w-full mt-4 mb-12 text-4xl font-medium sm:items-end text-accent-100 sm:flex-row">
        Posts
        <span className="ml-0 text-xl sm:ml-auto font-regular text-accent-600">
          A collection of thoughts and experiences.
        </span>
      </h1>
      <TooltipProvider>
        <ViewWithUtils data={data} />
      </TooltipProvider>
    </main>
  );
}
