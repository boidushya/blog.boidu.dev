export const SCROLL_INTENT_PX = 6;

export function watchScroll(onFrame: (y: number, dy: number) => void) {
  let last = window.scrollY;
  let frame = 0;
  const read = () => {
    frame = 0;
    const y = window.scrollY;
    const dy = y - last;
    last = y;
    onFrame(y, dy);
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(read);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
  };
}
