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

function letters({ word, long }: { word: string; long: boolean }, lit = false): Element {
  const className = long ? "sung-letter sung-letter--long" : "sung-letter";
  return span(
    lit ? "sung-letters sung-lit" : "sung-letters",
    Array.from(word, char =>
      lit
        ? { ...span(className, []), properties: { className: className.split(" "), dataChar: char } }
        : span(className, [{ type: "text", value: char }])
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
        const sung = span("sung-word", [letters(word), letters(word, true)]);
        return i === 0 ? [sung] : [{ type: "text", value: " " }, sung];
      });
      const spoken = typeof n === "string" ? `Chapter ${n}: ${title}` : title;
      heading.properties = {
        ...heading.properties,
        dataTitle: title,
        ariaLabel: spoken,
      };
      heading.children = [
        span("sung", [
          span("sung-spoken", [{ type: "text", value: spoken }]),
          { ...span("", words), properties: { ariaHidden: "true", inert: true } },
        ]),
        ...anchors,
      ];
    });
  });
};

export default rehypeChapterHeading;
