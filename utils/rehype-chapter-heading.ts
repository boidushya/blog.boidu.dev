import type { Element, ElementContent, Root } from "hast";
import { toText } from "hast-util-to-text";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const LONG_WORD = 7;

const span = (className: string, children: ElementContent[]): Element => ({
  type: "element",
  tagName: "span",
  properties: { className: [className] },
  children,
});

function letters(word: string): Element {
  const long = word.length >= LONG_WORD;
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
      const words = title.split(/\s+/).flatMap((word, i): ElementContent[] => {
        const sung = span("sung-word", [
          letters(word),
          { ...letters(word), properties: { className: ["sung-letters", "sung-lit"] } },
        ]);
        return i === 0 ? [sung] : [{ type: "text", value: " " }, sung];
      });
      heading.properties = { ...heading.properties, dataTitle: title };
      target.children = [
        span("sr-only", [{ type: "text", value: title }]),
        { ...span("sung", words), properties: { className: ["sung"], ariaHidden: "true" } },
      ];
    });
  });
};

export default rehypeChapterHeading;
