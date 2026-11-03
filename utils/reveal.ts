let jumping = false;
const waiting = new Set<() => void>();

/** Marks a chapter rail jump, so the reveals it scrolls past stay unplayed until it lands. */
export function startJump() {
  jumping = true;
}

export function endJump() {
  jumping = false;
  for (const reveal of Array.from(waiting)) reveal();
}

/** Calls onReveal once, the first time `amount` of el is in view outside a chapter rail jump. */
export function observeReveal(el: Element, amount: number, onReveal: () => void) {
  let inView = false;
  const reveal = () => {
    if (!inView || jumping) return;
    stop();
    onReveal();
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      reveal();
    },
    { threshold: amount }
  );
  const stop = () => {
    observer.disconnect();
    waiting.delete(reveal);
  };
  observer.observe(el);
  waiting.add(reveal);
  return stop;
}
