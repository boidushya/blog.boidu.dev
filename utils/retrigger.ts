const timers = new WeakMap<HTMLElement, Map<string, ReturnType<typeof setTimeout>>>();

export function retrigger(el: HTMLElement, className: string, ms: number) {
  const running = timers.get(el) ?? new Map<string, ReturnType<typeof setTimeout>>();
  timers.set(el, running);
  clearTimeout(running.get(className));
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  running.set(
    className,
    setTimeout(() => el.classList.remove(className), ms)
  );
}
