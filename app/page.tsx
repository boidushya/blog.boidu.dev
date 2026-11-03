import { ViewWithUtils } from "@/components";
import { getAllBlogs } from "@/lib/blogs";
import React from "react";

export default async function Home() {
  const data = await getAllBlogs();
  return (
    <div className="flex flex-col items-center pt-4 pb-16 sm:pb-32">
      <h1 className="flex flex-col items-start justify-between w-full mb-8 sm:mt-4 sm:mb-10 text-4xl font-medium sm:items-baseline text-accent-100 sm:flex-row">
        Posts
        <span className="ml-0 text-xl sm:ml-auto font-regular text-accent-600">
          A collection of thoughts and experiences.
        </span>
      </h1>
      <ViewWithUtils data={data} />
    </div>
  );
}
