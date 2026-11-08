import { WheelGestures } from "wheel-gestures";

const IDLE_MS = 220;
const LINE_PX = 30;

type Wheel = { deltaY: number; deltaMode: number; timeStamp: number; ctrlKey?: boolean; wheelDeltaY?: number };

/**
 * Trackpads report legacy `wheelDeltaY` as exactly -3 × `deltaY`; mouse wheels report notches of 120.
 * Without `wheelDeltaY`, line-mode deltas come from a mouse.
 */
const isTrackpad = (e: Wheel) => (e.wheelDeltaY ? e.wheelDeltaY === -3 * e.deltaY : e.deltaMode === 0);

/**
 * Calls `onStep` with how many steps to move. A mouse wheel steps once per `stepPx` scrolled, so
 * spinning it moves several. A trackpad steps once per swipe; wheel-gestures tells a swipe from the
 * momentum after it. Attach it with `observe(target)` and stop it with `disconnect()`.
 */
export function wheelSteps(stepPx: number, onStep: (steps: number) => void) {
  const gestures = WheelGestures({ preventWheelAction: false, reverseSign: false });
  let swiped = false;
  let bank = 0;
  let lastTime = Number.NEGATIVE_INFINITY;

  gestures.on("wheel", ({ isStart, isEnding, axisMovement, event }) => {
    if (isStart) swiped = false;
    // The ending update repeats the last event rather than bringing a new one
    if (isEnding) return;
    const wheel = event as Wheel;
    if (wheel.ctrlKey || !wheel.deltaY) return;

    if (!isTrackpad(wheel)) {
      if (wheel.timeStamp - lastTime > IDLE_MS) bank = 0;
      lastTime = wheel.timeStamp;
      bank += wheel.deltaMode === 1 ? wheel.deltaY * LINE_PX : wheel.deltaY;
      const steps = Math.trunc(bank / stepPx);
      bank -= steps * stepPx;
      if (steps) onStep(steps);
      return;
    }

    if (swiped || Math.abs(axisMovement[1]) < stepPx) return;
    swiped = true;
    onStep(Math.sign(axisMovement[1]));
  });
  return gestures;
}
