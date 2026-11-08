"use client";

import { PauseIcon, PlayIcon } from "@/components/player-icons";
import { resumeNext } from "@/utils/reading-progress";
import { pop } from "@/utils/retrigger";
import Link from "next/link";
import { useRef } from "react";

type Props = {
  playing: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
  /** Off where the press already moves the button, such as a player that morphs open around it. */
  pops?: boolean;
  /** Off where the press starts media, so the cue does not land on the audio switch. */
  cue?: boolean;
};

export function PlayButton({ playing, onToggle, label, className, pops = true, cue = true }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const onClick = () => {
    if (pops && ref.current) pop(ref.current);
    onToggle();
  };

  return (
    <button
      ref={ref}
      type="button"
      className={className ? `play-button ${className}` : "play-button"}
      aria-label={label}
      data-playing={playing || undefined}
      data-cuelume-tap={cue ? "" : undefined}
      onClick={onClick}
    >
      <PlayIcon className="i-play" />
      <PauseIcon className="i-pause" />
    </button>
  );
}

type LinkProps = {
  href: string;
  postId: string;
  label: string;
  disabled: boolean;
  className?: string;
  inert?: boolean;
};

export function PlayLink({ href, postId, label, disabled, className, inert }: LinkProps) {
  return (
    <Link
      className={className ? `play-button ${className}` : "play-button"}
      href={href}
      aria-label={label}
      aria-disabled={disabled}
      inert={inert}
      data-cuelume-navigate={disabled ? undefined : ""}
      onClick={e => {
        if (disabled) return e.preventDefault();
        pop(e.currentTarget);
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        resumeNext(postId);
      }}
    >
      <PlayIcon />
    </Link>
  );
}
