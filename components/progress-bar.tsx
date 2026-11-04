"use client";

import { setRollingText } from "@/utils/pip-swap";
import { type CSSProperties, type KeyboardEvent, type PointerEvent, useLayoutEffect, useRef } from "react";

const KEY_STEP_SECONDS = 2;
const PAGE_STEPS = 5;

type Props = {
  progress: number;
  now: string;
  total: string;
  max: number;
  label: string;
  onSeek: (fraction: number) => void;
  className?: string;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function ProgressBar({ progress, now, total, max, label, onSeek, className }: Props) {
  const nowTrack = useRef<HTMLSpanElement>(null);
  const totalTrack = useRef<HTMLSpanElement>(null);
  const nowFill = useRef<HTMLSpanElement>(null);
  const totalFill = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    for (const el of [nowTrack.current, nowFill.current]) if (el) setRollingText(el, now);
  }, [now]);

  useLayoutEffect(() => {
    for (const el of [totalTrack.current, totalFill.current]) if (el) setRollingText(el, total);
  }, [total]);

  const seekTo = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(clamp((e.clientX - rect.left) / rect.width));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekTo(e);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) seekTo(e);
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const step = max > 0 ? KEY_STEP_SECONDS / max : 0;
    const targets: Record<string, number> = {
      ArrowLeft: progress - step,
      ArrowDown: progress - step,
      ArrowRight: progress + step,
      ArrowUp: progress + step,
      PageDown: progress - step * PAGE_STEPS,
      PageUp: progress + step * PAGE_STEPS,
      Home: 0,
      End: 1,
    };
    if (!Object.hasOwn(targets, e.key)) return;
    e.preventDefault();
    onSeek(clamp(targets[e.key]));
  };

  const style: CSSProperties & { "--p": number } = { "--p": progress };

  return (
    <div
      className={className ? `progress-bar ${className}` : "progress-bar"}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(progress * max)}
      aria-valuetext={`${now} of ${total}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <div className="progress-bar-times" aria-hidden>
        <span ref={nowTrack} className="t" />
        <span ref={totalTrack} className="t" />
      </div>
      <div className="progress-bar-fill">
        <div className="progress-bar-times" aria-hidden>
          <span ref={nowFill} className="t" />
          <span ref={totalFill} className="t" />
        </div>
      </div>
    </div>
  );
}
