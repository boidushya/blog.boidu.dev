import assert from "node:assert/strict";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { applyBlockEdit, readBody } from "./source-edit";

const blocks = (raw: string) => {
  const body = readBody(raw);
  const tree = unified().use(remarkParse).parse(body);
  return tree.children.map(node => {
    const start = node.position?.start.offset ?? 0;
    const end = node.position?.end.offset ?? 0;
    return { start, end, expected: body.slice(start, end) };
  });
};

const post = [
  "---",
  'title: "Check"',
  "date: 2026-11-03",
  "---",
  "",
  "Intro with emoji 🎉 and ==mark==.",
  "",
  "Second paragraph.",
  "",
  "```ts",
  "const a = 1;",
  "```",
  "",
  "- one",
  "- two",
  "",
].join("\n");

const [intro, second, code, list] = blocks(post);
assert.equal(second.expected, "Second paragraph.");
assert.equal(code.expected, "```ts\nconst a = 1;\n```");

const edited = applyBlockEdit(post, { ...second, replacement: "Changed." });
assert.ok(edited);
assert.equal(edited, post.replace("Second paragraph.", "Changed."));
assert.ok(edited.startsWith('---\ntitle: "Check"'));

const afterEmoji = applyBlockEdit(post, { ...list, replacement: "- three" });
assert.equal(afterEmoji, post.replace("- one\n- two", "- three"));

assert.equal(
  applyBlockEdit(post, { ...intro, replacement: "" }),
  post.replace("Intro with emoji 🎉 and ==mark==.", "")
);

assert.equal(applyBlockEdit(post, { ...second, expected: "Stale.", replacement: "x" }), null);
assert.equal(applyBlockEdit(edited, { ...second, replacement: "x" }), null);
assert.equal(applyBlockEdit(post, { start: -1, end: 3, expected: "", replacement: "x" }), null);
assert.equal(applyBlockEdit(post, { start: 5, end: 2, expected: "", replacement: "x" }), null);

const crlf = post.replace(/\n/g, "\r\n");
const crlfSecond = blocks(crlf)[1];
assert.equal(crlfSecond.expected, "Second paragraph.");
assert.equal(
  applyBlockEdit(crlf, { ...crlfSecond, replacement: "Changed." }),
  crlf.replace("Second paragraph.", "Changed.")
);

const bare = "No frontmatter.\n\nSecond.\n";
const bareSecond = blocks(bare)[1];
assert.equal(applyBlockEdit(bare, { ...bareSecond, replacement: "Two." }), "No frontmatter.\n\nTwo.\n");

console.log("source-edit: all checks passed");
