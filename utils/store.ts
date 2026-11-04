import { useSyncExternalStore } from "react";

/** A module-level value that components can read and subscribe to; `initial` is also the server value. */
export function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  return {
    set(next: T) {
      if (Object.is(next, value)) return;
      value = next;
      for (const listener of Array.from(listeners)) listener();
    },
    use: () =>
      useSyncExternalStore(
        subscribe,
        () => value,
        () => initial
      ),
  };
}
