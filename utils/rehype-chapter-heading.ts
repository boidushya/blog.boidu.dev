import type { Element, ElementContent, Root } from "hast";
import { toText } from "hast-util-to-text";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { sungWords } from "@/utils/sung";

const span = (className: string, children: ElementContent[]): Element => ({
  type: "element",
  tagName: "span",
  properties: { className: [className] },
  children,
});

function letters({ word, long }: { word: string; long: boolean }): Element {
  return span(
    "sung-letters",
    Array.from(word, char =>
      span(long ? "sung-letter sung-letter--long" : "sung-letter", [{ type: "text", value: char }])
    )
  );
}

const rehypeChapterHeading: Plugin<[], Root> = () => tree => {
  visit(tree, node => {
    if (node.type !== "mdxJsxFlowElement" || (node as { name?: string }).name !== "Chapter") return;
    visit(node, "element", (heading: Element) => {
      if (heading.tagName !== "h2") return;
      const title = toText(heading).trim();
      const target =
        heading.children.find((child): child is Element => child.type === "element" && child.tagName === "a") ??
        heading;
      const words = sungWords(title).flatMap((word, i): ElementContent[] => {
        const sung = span("sung-word", [
          letters(word),
          { ...letters(word), properties: { className: ["sung-letters", "sung-lit"], ariaHidden: "true" } },
        ]);
        return i === 0 ? [sung] : [{ type: "text", value: " " }, sung];
      });
      heading.properties = { ...heading.properties, dataTitle: title };
      target.properties = { ...target.properties, ariaLabel: title };
      target.children = [span("sung", words)];
    });
  });
};

export default rehypeChapterHeading;
