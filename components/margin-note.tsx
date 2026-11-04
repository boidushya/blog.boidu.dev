"use client";

import { Handwriting } from "@/components/handwriting";
import { observeReveal } from "@/utils/reveal";
import { REVEAL } from "@/utils/sounds";
import { play } from "cuelume";
import { motion, useReducedMotion } from "motion/react";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const BRACKET_PATH = "M2 2.5 C5 1.8 8 1.6 10.5 2 C10.2 30 10.9 70 10.4 98 C7.5 98.6 4.5 98.4 1.5 98.9";
const NOTE_DELAY = 0.45;

type Props = {
  note: string;
  /** Inline notes only: an image shown instead of the handwriting, with `note` as its alt text. */
  icon?: string;
  /** Brackets a phrase inside a paragraph instead of whole blocks. */
  inline?: boolean;
  children: React.ReactNode;
};

function useReveal(ref: React.RefObject<HTMLElement | null>) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    return observeReveal(ref.current, 0.6, quiet => {
      setShown(true);
      if (!quiet && !matchMedia("(prefers-reduced-motion: reduce)").matches) play("open", REVEAL);
    });
  }, [ref]);
  return shown;
}

function Bracket({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 12 100"
      preserveAspectRatio="none"
      className={className}
      style={style}
      fill="none"
      variants={{ hidden: { clipPath: "inset(0 0 100% 0)" }, shown: { clipPath: "inset(0 0 0% 0)" } }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <path
        d={BRACKET_PATH}
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  );
}

function Icon({
  src,
  alt,
  className,
  style,
}: { src: string; alt: string; className: string; style?: React.CSSProperties }) {
  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      style={style}
      variants={{ hidden: { opacity: 0, scale: 0.6, rotate: -12 }, shown: { opacity: 1, scale: 1, rotate: -6 } }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.3, delay: NOTE_DELAY }}
    />
  );
}

function InlineMarginNote({ note, icon, children }: Omit<Props, "inline">) {
  const reduceMotion = useReducedMotion();
  const draw = !reduceMotion;
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useReveal(ref);
  const [span, setSpan] = useState<{ top: number; height: number }>();

  useLayoutEffect(() => {
    const phrase = ref.current;
    const block = phrase?.parentElement;
    if (!phrase || !block) return;
    const measure = () => {
      const lines = Array.from(phrase.getClientRects());
      const first = lines[0];
      const last = lines[lines.length - 1];
      if (!first || !last) return;
      const origin = block.getBoundingClientRect().top;
      setSpan({ top: first.top - origin, height: last.bottom - first.top });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(block);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.span
      ref={ref}
      className="margin-note-inline"
      initial={draw ? "hidden" : false}
      animate={shown || !draw ? "shown" : "hidden"}
    >
      {children}
      {span && <Bracket className="margin-note-inline-bracket" style={{ top: span.top, height: span.height }} />}
      {icon ? (
        <Icon
          src={icon}
          alt={note}
          className="margin-note-inline-icon"
          style={span && { top: span.top + span.height / 2 }}
        />
      ) : (
        <Handwriting text={note} delay={NOTE_DELAY} className="margin-note-inline-text" />
      )}
    </motion.span>
  );
}

function BlockMarginNote({ note, children }: Pick<Props, "note" | "children">) {
  const reduceMotion = useReducedMotion();
  const draw = !reduceMotion;
  const ref = useRef<HTMLDivElement>(null);
  const shown = useReveal(ref);

  return (
    <motion.div
      ref={ref}
      className="relative"
      initial={draw ? "hidden" : false}
      animate={shown || !draw ? "shown" : "hidden"}
    >
      {children}
      <Bracket className="absolute top-0 bottom-0 hidden w-3 h-full xl:block left-[calc(100%+1.25rem)] text-accent-400" />
      <Handwriting
        text={note}
        delay={NOTE_DELAY}
        className="block -mt-3 mb-6 text-right text-2xl leading-none text-accent-400 -rotate-2 xl:absolute xl:m-0 xl:top-1/2 xl:-translate-y-1/2 xl:left-[calc(100%+3rem)] xl:w-44 xl:text-left"
      />
    </motion.div>
  );
}

export function MarginNote({ note, icon, inline, children }: Props) {
  if (inline)
    return (
      <InlineMarginNote note={note} icon={icon}>
        {children}
      </InlineMarginNote>
    );
  return <BlockMarginNote note={note}>{children}</BlockMarginNote>;
}
