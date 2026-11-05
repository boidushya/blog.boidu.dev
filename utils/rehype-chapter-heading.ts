import { sungWords } from "@/utils/sung";
import type { Element, ElementContent, Root } from "hast";
import { toText } from "hast-util-to-text";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

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
    if (node.type !== "mdxJsxFlowElement" || node.name !== "Chapter") return;
    const n = node.attributes.find(attribute => attribute.type === "mdxJsxAttribute" && attribute.name === "n")?.value;
    visit(node, "element", (heading: Element) => {
      if (heading.tagName !== "h2") return;
      const title = toText(heading).trim();
      const anchors = heading.children.filter(child => child.type === "element" && child.tagName === "a");
      const words = sungWords(title).flatMap((word, i): ElementContent[] => {
        const sung = span("sung-word", [
          letters(word),
          { ...letters(word), properties: { className: ["sung-letters", "sung-lit"] } },
        ]);
        return i === 0 ? [sung] : [{ type: "text", value: " " }, sung];
      });
      heading.properties = {
        ...heading.properties,
        dataTitle: title,
        ariaLabel: typeof n === "string" ? `Chapter ${n}: ${title}` : title,
      };
      heading.children = [
        span("sung", [
          span("sung-spoken", [{ type: "text", value: title }]),
          { ...span("", words), properties: { ariaHidden: "true", inert: true } },
        ]),
        ...anchors,
      ];
    });
  });
};

export default rehypeChapterHeading;
