import { setEnabled, unlock } from "cuelume";

const STORAGE_KEY = "blog-sounds";

export const getSoundsEnabled = () => localStorage.getItem(STORAGE_KEY) !== "off";

export function setSoundsEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  setEnabled(enabled);
  if (enabled) unlock();
}
