import assert from "node:assert/strict";
import { layTapes, seededRandom, swipeTimeAt } from "./tape-layout";

const ms = (value: string) => Number(value.replace("ms", ""));
const deg = (value: string) => Number(value.replace("deg", ""));

let previous = 0;
for (let i = 0; i <= 1000; i++) {
  const t = swipeTimeAt(i / 1000);
  assert.ok(t >= 0 && t <= 1, `swipeTimeAt(${i / 1000}) = ${t}`);
  assert.ok(t >= previous - 1e-9, `swipeTimeAt is not monotonic at ${i / 1000}`);
  previous = t;
}

const random = seededRandom("check");
let creased = 0;
for (let n = 0; n < 20000; n++) {
  const seed =
    n % 3 === 0
      ? String(n)
      : Array.from({ length: 1 + Math.floor(random() * 24) }, () =>
          String.fromCodePoint(32 + Math.floor(random() * 0x2ff))
        ).join("");
  const tapes = layTapes(seed);
  assert.deepEqual(layTapes(seed), tapes, `seed ${JSON.stringify(seed)} is not deterministic`);

  const { style, crease } = tapes;
  const at = [ms(style["--t1-at"]), ms(style["--t2-at"])];
  const press = [ms(style["--t1-press"]), ms(style["--t2-press"])];
  const swipe = [ms(style["--t1-swipe"]), ms(style["--t2-swipe"])];
  assert.ok(at[0] >= 140 && at[0] <= 260, `left start ${at[0]}`);
  assert.ok(at[1] - at[0] >= 329 && at[1] - at[0] <= 511, `right gap ${at[1] - at[0]}`);
  assert.ok(Math.abs(deg(style["--t1-rot"]) + 4) <= 1.5 + 1e-9, `left rotation ${style["--t1-rot"]}`);
  assert.ok(Math.abs(deg(style["--t2-rot"]) - 3) <= 1.5 + 1e-9, `right rotation ${style["--t2-rot"]}`);
  for (let i = 0; i < 2; i++) {
    assert.ok(press[i] >= 380 && press[i] <= 660, `press ${press[i]}`);
    assert.ok(swipe[i] >= 470 && swipe[i] <= 650, `swipe ${swipe[i]}`);
  }

  if (!crease) continue;
  creased++;
  const pressed = at[crease.tape] + press[crease.tape];
  assert.ok(
    crease.at >= pressed && crease.at <= pressed + swipe[crease.tape],
    `crease lands outside its swipe at ${crease.at}`
  );
  const numbers = crease.d.slice(1).split(/ L| /).map(Number);
  assert.ok(numbers.length >= 4 && numbers.every(Number.isFinite), `crease path ${crease.d}`);
  for (let i = 0; i < numbers.length; i += 2)
    assert.ok(numbers[i] > -8 && numbers[i] < 104, `crease leaves the tape: ${crease.d}`);
}

assert.ok(creased > 9000 && creased < 11000, `about half the seeds should crease, got ${creased} of 20000`);
console.log("tape-layout ok");
