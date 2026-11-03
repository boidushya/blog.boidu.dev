import { ViewWithUtils } from "@/components";
import { getAllBlogs } from "@/lib/blogs";
import React from "react";

export default async function Home() {
  const data = await getAllBlogs();
  return (
    <div className="flex flex-col items-center pt-3 pb-16 sm:pt-0 sm:pb-32">
      <h1 className="flex flex-col items-start w-full gap-2 mb-8 text-4xl font-medium text-accent-100">
        Posts
        <span className="text-lg font-regular text-accent-600">
          A collection of thoughts and experiences.
        </span>
      </h1>
      <ViewWithUtils data={data} />
    </div>
  );
}
