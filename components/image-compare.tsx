"use client";

import { play } from "cuelume";
import Image from "next/image";
import { useRef, useState } from "react";

const HANDLE_RADIUS_PX = 20;

interface ImageCompareProps {
  before: string;
  after: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ImageCompare({
  before,
  after,
  beforeAlt = "Before",
  afterAlt = "After",
  beforeLabel,
  afterLabel,
}: ImageCompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [hasInteracted, setHasInteracted] = useState(false);
  const dragging = useRef(false);
  // Where the pointer grabbed the handle, so the divider doesn't jump to the pointer.
  const grabOffset = useRef(0);

  // A drag clicks once per tenth of the width, like detents; each key press clicks on its own.
  const move = (next: number) => {
    const crossed = Math.floor(next / 10) !== Math.floor(sliderPosition / 10);
    if (!dragging.current || crossed) {
      play("select", { emphasis: "subtle", direction: next < sliderPosition ? "back" : "forward" });
    }
    setHasInteracted(true);
    setSliderPosition(next);
  };

  return (
    <div data-wide className="my-6 touch-none group image-compare">
      <div className="relative w-full border select-none border-accent-600/20" style={{ aspectRatio: "16/9" }}>
        {/* Before Image with Label */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <Image
            src={before}
            alt={beforeAlt}
            fill
            className="object-cover !rounded-none !border-0"
            draggable={false}
            sizes="100vw"
          />
          <span className="absolute px-3 py-1 text-sm font-medium border rounded-md pointer-events-none top-4 left-4 bg-accent-900/25 backdrop-blur-sm text-accent-50 border-accent-600/30">
            {beforeLabel || beforeAlt}
          </span>
        </div>

        {/* After Image with Label */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 0 0 ${sliderPosition}%)`,
          }}
        >
          <Image
            src={after}
            alt={afterAlt}
            fill
            className="object-cover !rounded-none !border-0"
            draggable={false}
            sizes="100vw"
          />
          <span className="absolute px-3 py-1 text-sm font-medium border rounded-md pointer-events-none top-4 right-4 bg-accent-900/50 backdrop-blur-sm text-accent-50 border-accent-600/30">
            {afterLabel || afterAlt}
          </span>
        </div>

        {/* Slider */}
        <div
          className="absolute top-0 bottom-0 z-10 w-0.5 bg-accent-900 pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          {/* Handle */}
          <div className="absolute flex items-center justify-center w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-lg top-1/2 left-1/2 bg-accent-900 text-accent-50 btn-glass image-compare__handle">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M4.825 12.025L8.7 15.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.213-.325T2.426 12t.063-.375t.212-.325l4.6-4.6q.3-.3.713-.3t.712.3t.3.713t-.3.712zm14.35-.05L15.3 8.1q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.6 4.6q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.6 4.6q-.3.3-.7.288t-.7-.313t-.3-.712t.3-.713z"
              />
            </svg>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step="any"
          value={sliderPosition}
          aria-label={`Compare ${beforeLabel || beforeAlt} and ${afterLabel || afterAlt}`}
          aria-valuetext={`${Math.round(sliderPosition)}% ${beforeLabel || beforeAlt}`}
          onPointerDown={e => {
            dragging.current = true;
            const box = e.currentTarget.getBoundingClientRect();
            const offset = ((e.clientX - box.left) / box.width) * 100 - sliderPosition;
            grabOffset.current = Math.abs((offset / 100) * box.width) <= HANDLE_RADIUS_PX ? offset : 0;
          }}
          onPointerUp={() => {
            dragging.current = false;
            grabOffset.current = 0;
          }}
          onChange={e => move(Math.min(100, Math.max(0, Number(e.currentTarget.value) - grabOffset.current)))}
          className="image-compare__range"
        />
      </div>
      <span className="flex items-center justify-center gap-2 mt-4 text-sm not-italic font-normal text-center text-accent-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 p-[1px] mb-[1px] shadow border border-accent-400/50 bg-accent-800/20 rounded ${!hasInteracted ? "group-hover:animate-slide-hint" : ""}`}
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M4.825 12.025L8.7 15.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.213-.325T2.426 12t.063-.375t.212-.325l4.6-4.6q.3-.3.713-.3t.712.3t.3.713t-.3.712zm14.35-.05L15.3 8.1q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.6 4.6q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.6 4.6q-.3.3-.7.288t-.7-.313t-.3-.712t.3-.713z"
          />
        </svg>
        <span>Drag slider to compare</span>
      </span>
    </div>
  );
}
