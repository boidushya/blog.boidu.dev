"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;

    setHasInteracted(true);

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    updateSliderPosition(e.touches[0].clientX);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    updateSliderPosition(e.clientX);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="my-6 touch-none group">
      <div
        ref={containerRef}
        className="relative w-full border select-none cursor-col-resize border-accent-600/20"
        onClick={handleClick}
        style={{ aspectRatio: "16/9" }}
      >
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
          className="absolute top-0 bottom-0 z-10 w-0.5 bg-accent-900 cursor-col-resize"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* Handle */}
          <div className="absolute flex items-center justify-center w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-lg top-1/2 left-1/2 bg-accent-900 text-accent-50 btn-glass active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M4.825 12.025L8.7 15.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-4.6-4.6q-.15-.15-.213-.325T2.426 12t.063-.375t.212-.325l4.6-4.6q.3-.3.713-.3t.712.3t.3.713t-.3.712zm14.35-.05L15.3 8.1q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.6 4.6q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.6 4.6q-.3.3-.7.288t-.7-.313t-.3-.712t.3-.713z"
              />
            </svg>
          </div>
        </div>
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
