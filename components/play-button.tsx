"use client";

import { PauseIcon, PlayIcon } from "@/components/player-icons";
import { useEffect, useRef } from "react";

type Props = {
  playing: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
};

export function PlayButton({ playing, onToggle, label, className }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const popTimer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(popTimer.current), []);

  const onClick = () => {
    const el = ref.current;
    if (el) {
      el.classList.remove("control-pop");
      void el.offsetWidth;
      el.classList.add("control-pop");
      window.clearTimeout(popTimer.current);
      popTimer.current = window.setTimeout(() => el.classList.remove("control-pop"), 320);
    }
    onToggle();
  };

  return (
    <button
      ref={ref}
      type="button"
      className={className ? `play-button ${className}` : "play-button"}
      aria-label={label}
      data-playing={playing || undefined}
      data-cuelume-tap=""
      onClick={onClick}
    >
      <PlayIcon className="i-play" />
      <PauseIcon className="i-pause" />
    </button>
  );
}
