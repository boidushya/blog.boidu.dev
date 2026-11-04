import assert from "node:assert/strict";
import { videoSize } from "./video-size";

async function check() {
  assert.deepEqual(await videoSize("/composer/sync.mp4"), { width: 1760, height: 960 });
  assert.deepEqual(await videoSize("/composer/nightmare-fuel.mp4"), { width: 320, height: 326 });
  console.log("video-size: reads mp4 track sizes");
}

check();
