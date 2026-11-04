"use client";

import { RollingText } from "@/components/pip-line";
import type { CSSVars } from "@/utils/css-vars";
import { clamp01 } from "@/utils/math";
import type { HTMLAttributes, KeyboardEvent, PointerEvent } from "react";

const KEY_STEP_SECONDS = 2;
const PAGE_STEPS = 5;

type Seek = { max: number; onSeek: (fraction: number) => void };

type Display = {
  progress: number;
  now: string;
  total: string;
  label: string;
  className?: string;
  delay?: number;
  instant?: boolean;
};

type Props = Display & (Seek | { max?: undefined; onSeek?: undefined });

function Times({ now, total, delay, instant }: { now: string; total: string; delay?: number; instant?: boolean }) {
  return (
    <div className="progress-bar-times" aria-hidden>
      <span className="t">
        <RollingText text={now} delay={delay} instant={instant} />
      </span>
      <span className="t">
        <RollingText text={total} delay={delay} instant={instant} />
      </span>
    </div>
  );
}

function sliderProps({ progress, now, total, max, onSeek }: Display & Seek): HTMLAttributes<HTMLDivElement> {
  const seekTo = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(clamp01((e.clientX - rect.left) / rect.width));
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return {
    role: "slider",
    tabIndex: 0,
    "aria-valuemin": 0,
    "aria-valuemax": Math.round(max),
    "aria-valuenow": Math.round(progress * max),
    "aria-valuetext": `${now} of ${total}`,
    onPointerDown: e => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      seekTo(e);
    },
    onPointerMove: e => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) seekTo(e);
    },
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
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
      onSeek(clamp01(targets[e.key]));
    },
  };
}

export function ProgressBar(props: Props) {
  const { progress, now, total, label, className, delay, instant } = props;
  const interaction = props.onSeek ? sliderProps(props) : { role: "img" };
  const style: CSSVars = { "--p": progress };

  return (
    <div
      className={className ? `progress-bar ${className}` : "progress-bar"}
      aria-label={label}
      style={style}
      {...interaction}
    >
      <Times now={now} total={total} delay={delay} instant={instant} />
      <div className="progress-bar-fill">
        <Times now={now} total={total} delay={delay} instant={instant} />
      </div>
    </div>
  );
}
