import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/**
 * Rehype plugin to transform video URLs in markdown to HTML5 video elements
 * with lazy loading and autoplay support
 */
const rehypeVideo: Plugin<[], Root> = function () {
  return function (tree: Root) {
    visit(tree, "element", (node: Element, index, parent) => {
      if (!parent || index == null || node.tagName !== "img") {
        return;
      }

      const src = node.properties?.src as string;
      if (!src) return;

      const videoExtensions = /\.(mp4|webm|mov|avi|mkv|m4v)($|\?)/i;
      const isVideo = videoExtensions.test(src);

      if (!isVideo) return;

      const videoElement: Element = {
        type: "element",
        tagName: "video",
        properties: {
          controls: false,
          autoplay: true,
          loop: true,
          muted: true,
          playsinline: true,
          loading: "lazy",
          style: "width: 100%; height: auto; border-radius: 0.5rem;",
        },
        children: [
          {
            type: "element",
            tagName: "source",
            properties: {
              src,
              type: `video/${src.split(".").pop()?.split("?")[0] || "mp4"}`,
            },
            children: [],
          },
          {
            type: "text",
            value: "Your browser does not support the video tag.",
          },
        ],
      };

      parent.children[index] = videoElement;
    });
  };
};

export default rehypeVideo;
