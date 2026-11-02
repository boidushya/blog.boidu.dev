import assert from "node:assert/strict";
import { parseSignature, toSvg } from "./signature";

const canvasSvg = (body: string) =>
  `<svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" id="react-sketch-canvas" viewBox="0 0 250 100" width="250" height="100"><g id="react-sketch-canvas__eraser-stroke-group" display="none"><rect id="react-sketch-canvas__mask-background" x="0" y="0" width="100%" height="100%" fill="white"></rect></g><defs></defs><g id="react-sketch-canvas__stroke-group-0" mask="url(#react-sketch-canvas__eraser-mask-0)">${body}</g></svg>`;

const stroke =
  '<path id="react-sketch-canvas__0" d="M 24.2332763671875,15.6500244140625 C 24.2832763671875,15.6500244140625 24.4332763671875,15.6500244140625 24.4832763671875, 15.6500244140625" stroke-linecap="round" stroke="red" stroke-width="2" fill="none"></path>';
const dot = '<circle cx="120.04999" cy="-0.04" r="1" fill="red"></circle>';

const parsed = parseSignature(canvasSvg(stroke + dot));
assert.deepEqual(parsed, {
  paths: ["M24.2,15.7C24.3,15.7 24.4,15.7 24.5,15.7"],
  dots: [{ cx: 120, cy: 0, r: 1 }],
});
assert.ok(parsed);
assert.deepEqual(parseSignature(toSvg(parsed)), parsed);

assert.equal(parseSignature(canvasSvg("")), null);
assert.equal(parseSignature(""), null);
assert.equal(parseSignature(canvasSvg('<path d="M 1,1 L 2,2" onload="alert(1)"></path>'))?.paths[0], "M1,1L2,2");
assert.equal(parseSignature(canvasSvg('<path d="M 1,1 L 2,2\\" onload=\\"alert(1)"></path>')), null);
assert.equal(parseSignature(canvasSvg('<path d="M 1,1 A 2,2 0 0 1 3,3"></path>')), null);
assert.equal(parseSignature(canvasSvg('<path d="url(javascript:alert(1))"></path>')), null);
assert.equal(parseSignature(canvasSvg("<path></path>")), null);
assert.equal(parseSignature(canvasSvg('<circle cx="x" cy="1" r="1"></circle>')), null);
assert.ok(
  !toSvg(parseSignature(canvasSvg(`<script>alert(1)</script>${stroke}`)) ?? { paths: [], dots: [] }).includes("script")
);

const huge = `<path d="M 0,0 ${"L 1,1 ".repeat(25000)}"></path>`;
assert.equal(parseSignature(canvasSvg(huge)), null);

console.log("signature: all checks passed");
