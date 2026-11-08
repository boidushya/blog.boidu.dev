import assert from "node:assert/strict";
import { clock } from "./clock";
import { pickShuffle } from "./reading-progress";

const ids = ["composer", "intentional-design", "better-lyrics"];
const progress = { composer: 0.3, "intentional-design": 1, "better-lyrics": 1 };

for (let i = 0; i < 50; i++) {
  assert.equal(pickShuffle(ids, "intentional-design", progress, Math.random()), "composer");
  assert.notEqual(pickShuffle(ids, "composer", { ...progress, composer: 1 }, Math.random()), "composer");
}
assert.equal(pickShuffle(["only"], "only", {}, 0.5), undefined);

assert.equal(clock(27), "27:00");
assert.equal(clock(27 * 0.65), "17:33");
assert.equal(clock(0.9999), "1:00");
assert.equal(clock(0), "0:00");
console.log("reading-progress: all checks passed");
