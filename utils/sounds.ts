import { type PlayOptions, play, setEnabled, unlock } from "cuelume";

const STORAGE_KEY = "blog-sounds";
const MUTE_TAIL_MS = 400;

/** Cues for things that happen while reading, not in answer to a click: quieter than any click. */
export const REVEAL: PlayOptions = { emphasis: "subtle", volume: 0.5 };

let enabled = true;
let muteTimer: ReturnType<typeof setTimeout> | undefined;
let walkContext: AudioContext | undefined;

export const getSoundsEnabled = () => localStorage.getItem(STORAGE_KEY) !== "off";

export function setSoundsEnabled(on: boolean) {
  localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  enabled = on;
  clearTimeout(muteTimer);
  if (on) {
    setEnabled(true);
    unlock();
    wakeWalk();
    play("toggle", { theme: "bubble" });
    return;
  }
  // Let the switch-off cue ring out before muting, so turning sounds off is still heard once.
  play("toggle", { theme: "bubble", direction: "back" });
  muteTimer = setTimeout(() => setEnabled(false), MUTE_TAIL_MS);
}

/**
 * Applies the stored preference and unlocks audio on the reader's first click or key press
 * anywhere. Browsers allow sound only after a gesture, and scrolling never counts.
 */
export function startSounds() {
  enabled = getSoundsEnabled();
  setEnabled(enabled);
  const unlockOnce = () => {
    stop();
    unlock();
    wakeWalk();
  };
  const stop = () => {
    window.removeEventListener("pointerdown", unlockOnce, true);
    window.removeEventListener("keydown", unlockOnce, true);
  };
  window.addEventListener("pointerdown", unlockOnce, true);
  window.addEventListener("keydown", unlockOnce, true);
  return stop;
}

// Pentatonic steps above C3, so any run of notes stays consonant.
const WALK_STEPS = [0, 2, 4, 7, 9, 12, 14, 16, 19];
const WALK_ROOT_HZ = 130.81;
const WALK_HARMONICS = [
  [1, 1],
  [2, 0.28],
  [3, 0.08],
] as const;

// Safari only starts an AudioContext inside a gesture, so the walk context is made and resumed there.
function wakeWalk() {
  if (typeof AudioContext === "undefined") return;
  walkContext ??= new AudioContext();
  walkContext.resume();
}

/**
 * The scale step each word of a title sings, pitched by length: long words low, short words high.
 * A word that would repeat the note before it climbs one step instead, so a run never stutters.
 */
export function walkMelody(wordLengths: number[]) {
  const top = WALK_STEPS.length - 1;
  const byLength = wordLengths.map(letters => Math.max(0, Math.min(top, WALK_STEPS.length - letters)));
  const melody: number[] = [];
  byLength.forEach((step, i) => {
    const previous = melody[i - 1];
    if (i === 0 || (step !== byLength[i - 1] && step !== previous)) melody.push(step);
    else melody.push(previous < top ? previous + 1 : previous - 1);
  });
  return melody;
}

/** One soft pressed note on a step of the walk scale. cuelume has no pitch control, so this is synthesized here. */
export function playWalkNote(step: number, volume = REVEAL.volume ?? 1) {
  const ac = walkContext;
  if (!enabled || ac?.state !== "running") return;

  const frequency = WALK_ROOT_HZ * 2 ** (WALK_STEPS[step] / 12);
  const now = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = 0.16 * volume;
  out.connect(ac.destination);

  for (const [multiple, level] of WALK_HARMONICS) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = frequency * multiple;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9 / multiple);
    osc.connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + 1);
  }

  const noise = ac.createBuffer(1, Math.round(ac.sampleRate * 0.008), ac.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
  const click = ac.createBufferSource();
  const band = ac.createBiquadFilter();
  const clickGain = ac.createGain();
  click.buffer = noise;
  band.type = "bandpass";
  band.frequency.value = 4000;
  band.Q.value = 1.2;
  clickGain.gain.value = 0.25;
  click.connect(band).connect(clickGain).connect(out);
  click.start(now);
}
