import { play, setEnabled, unlock } from "cuelume";

const STORAGE_KEY = "blog-sounds";
const MUTE_TAIL_MS = 400;

let muteTimer: ReturnType<typeof setTimeout> | undefined;

export const getSoundsEnabled = () => localStorage.getItem(STORAGE_KEY) !== "off";

export function setSoundsEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  clearTimeout(muteTimer);
  if (enabled) {
    setEnabled(true);
    unlock();
    play("toggle", { theme: "bubble" });
    return;
  }
  // Let the switch-off cue ring out before muting, so turning sounds off is still heard once.
  play("toggle", { theme: "bubble", direction: "back" });
  muteTimer = setTimeout(() => setEnabled(false), MUTE_TAIL_MS);
}
