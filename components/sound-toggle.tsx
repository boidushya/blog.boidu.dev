"use client";

import { Tooltip } from "@/utils/components";
import { getSoundsEnabled, setSoundsEnabled } from "@/utils/sounds";
import { motion } from "motion/react";
import { useState } from "react";

const WAVES = ["M15.5 8.5a5 5 0 0 1 0 7", "M18.5 5.5a9.5 9.5 0 0 1 0 13"];
const CROSS = ["M16 9.5l5 5", "M21 9.5l-5 5"];
const DRAW = { type: "spring", duration: 0.35, bounce: 0 } as const;

const SoundToggle = () => {
  const [on, setOn] = useState(getSoundsEnabled);

  return (
    <Tooltip content={on ? "Mute sounds" : "Turn sounds on"}>
      <button
        aria-label="Sounds"
        aria-pressed={on}
        onClick={() => {
          setSoundsEnabled(!on);
          setOn(!on);
        }}
        className="sound-toggle relative grid p-2 -mx-2 rounded-md place-items-center pressable text-accent-400 hover:text-accent-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5 overflow-visible"
        >
          <motion.path
            d="M11 5 6.5 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.5l4.5 4V5Z"
            fill="currentColor"
            animate={{ x: on ? 0 : 1.5 }}
            transition={DRAW}
          />
          {WAVES.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              className="sound-toggle__wave"
              style={{ animationDelay: `${i * 80}ms` }}
              initial={false}
              animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
              transition={{ ...DRAW, delay: on ? i * 0.08 : (WAVES.length - 1 - i) * 0.05 }}
            />
          ))}
          {CROSS.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              initial={false}
              animate={{ pathLength: on ? 0 : 1, opacity: on ? 0 : 1 }}
              transition={{ ...DRAW, delay: on ? 0 : 0.12 + i * 0.08 }}
            />
          ))}
        </svg>
      </button>
    </Tooltip>
  );
};

export default SoundToggle;
