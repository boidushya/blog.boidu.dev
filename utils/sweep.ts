type SweepTiming = { pxPerMs: number; minWordMs: number; overlapMs: number; startMs: number };
type SungWord = { startMs: number; letters: number };

const WAVE_CREST = 0.4;
const MIN_RISE_MS = 320;

// The sweep's mask is 260% wide with its soft edge between 42% and 58%, so its leading edge
// touches x (0 to 1 across the word) at progress (x + 0.092) / 1.6 and fully lights it at (x + 0.508) / 1.6.
export function timeSweep(heading: HTMLElement, { pxPerMs, minWordMs, overlapMs, startMs }: SweepTiming): SungWord[] {
  const words: SungWord[] = [];
  let start = startMs;
  for (const word of Array.from(heading.querySelectorAll<HTMLElement>(".sung-word"))) {
    const box = word.getBoundingClientRect();
    const duration = Math.max(minWordMs, box.width / pxPerMs);
    word.style.setProperty("--sweep-start", `${Math.round(start)}ms`);
    word.style.setProperty("--sweep-duration", `${Math.round(duration)}ms`);
    const at = (progress: number) => start + duration * Math.min(1, Math.max(0, progress));
    const [base, lit] = Array.from(word.querySelectorAll(".sung-letters"), group =>
      Array.from(group.querySelectorAll<HTMLElement>(".sung-letter"))
    );
    base.forEach((letter, i) => {
      const r = letter.getBoundingClientRect();
      const touched = at(((r.left - box.left) / box.width + 0.092) / 1.6);
      const litAt = at(((r.right - box.left) / box.width + 0.508) / 1.6);
      const wave = Math.max(litAt - touched, MIN_RISE_MS) / WAVE_CREST;
      for (const el of [letter, lit[i]]) {
        el.style.setProperty("--wave-start", `${Math.round(touched)}ms`);
        el.style.setProperty("--wave-duration", `${Math.round(wave)}ms`);
      }
    });
    words.push({ startMs: start, letters: base.length });
    start += duration - overlapMs;
  }
  return words;
}
