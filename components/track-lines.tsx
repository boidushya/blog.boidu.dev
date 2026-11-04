"use client";

import { PipLine } from "@/components/pip-line";
import type { BlogCard } from "@/lib/blogs";
import { handwriting } from "@/utils/fonts";

export function TrackName({ post, className }: { post: BlogCard; className: string }) {
  return <PipLine className={`track-name ${className} ${handwriting.className}`} units={post.short.split(/(?<= )/)} />;
}

export function TrackTags({ post, className }: { post: BlogCard; className: string }) {
  return (
    <PipLine
      className={className}
      units={post.labels.flatMap((label, j) => (j ? ["·", label] : [label]))}
      delay={90}
      renderUnit={(unit, i) => (i === 0 ? <b>{unit}</b> : i % 2 ? <i>{unit}</i> : unit)}
    />
  );
}
