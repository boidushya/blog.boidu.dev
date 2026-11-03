import { IS_DEV } from "@/utils/constants";
import type { Element, ElementContent, Root } from "hast";
import type { Plugin } from "unified";

const BLOCK_TYPES = new Set(["element", "mdxJsxFlowElement"]);

const rehypeSourceBlocks: Plugin<[], Root> = function () {
  return function (tree, file) {
    if (!IS_DEV) return;
    const bodyLength = String(file.value).length;
    tree.children = tree.children.map(child => {
      const start = child.position?.start.offset;
      const end = child.position?.end.offset;
      if (!BLOCK_TYPES.has(child.type) || start === undefined || end === undefined) return child;
      const block: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["src-block"], dataSrcStart: start, dataSrcEnd: end, dataSrcBody: bodyLength },
        children: [child as ElementContent],
      };
      return block;
    });
  };
};

export default rehypeSourceBlocks;
