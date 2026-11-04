"use client";

import { PauseIcon, PlayIcon } from "@/components/player-icons";
import { retrigger } from "@/utils/retrigger";
import { useRef } from "react";

type Props = {
  playing: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
};

export function PlayButton({ playing, onToggle, label, className }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const onClick = () => {
    if (ref.current) retrigger(ref.current, "control-pop", 320);
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
