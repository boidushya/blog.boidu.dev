import type { Root } from "mdast";
import { findAndReplace } from "mdast-util-find-and-replace";
import type { Plugin } from "unified";

const remarkMark: Plugin<[], Root> = function () {
  return function (tree) {
    findAndReplace(tree, [
      /(?<![\w=])==(?=\S)([^=\n]+?)(?<=\S)==(?![\w=])/g,
      (_: string, text: string) => ({ type: "text", value: text, data: { hName: "mark" } }),
    ]);
  };
};

export default remarkMark;
