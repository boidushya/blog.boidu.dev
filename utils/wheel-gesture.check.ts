import assert from "node:assert/strict";
import { wheelSteps } from "./wheel-gesture";
// A real MacBook trackpad in Chrome, [ms, deltaY]: one flick down, one up, one down.
import recorded from "./wheel-gesture.fixture.json";

async function steps(events: { timeStamp: number; deltaY: number; wheelDeltaY: number }[]) {
  const moves: number[] = [];
  const gestures = wheelSteps(90, step => moves.push(step));
  gestures.feedWheel(events.map(e => ({ ...e, deltaX: 0, deltaMode: 0 })));
  // wheel-gestures ends a gesture on a timer
  await new Promise(resolve => setTimeout(resolve, 1000));
  gestures.disconnect();
  return moves;
}

async function check() {
  const flicks = recorded.map(([timeStamp, deltaY]) => ({ timeStamp, deltaY, wheelDeltaY: -3 * deltaY }));
  assert.deepEqual(await steps(flicks), [1, -1, 1], "each real trackpad flick moves one post");

  const notches = [0, 40, 80, 120, 160].map(timeStamp => ({ timeStamp, deltaY: 100, wheelDeltaY: -120 }));
  assert.deepEqual(await steps(notches), [1, 1, 1, 1, 1], "each mouse wheel notch moves a post");
  console.log("wheel-gesture: ok");
}

check();
