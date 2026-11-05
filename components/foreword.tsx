"use client";

import { GuestHand, Handwriting } from "@/components/handwriting";
import type { CSSVars } from "@/utils/css-vars";
import { useReveal } from "@/utils/reveal";
import { layTapes } from "@/utils/tape-layout";
import type React from "react";
import { useEffect, useRef, useState } from "react";

function Signature({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useReveal(ref, 0.6);
  return (
    <div ref={ref} role="img" aria-label={name} className="foreword-sig" data-shown={shown || undefined}>
      <Handwriting text={name} delay={0.1} shown={shown} className="foreword-sig-name" inkEndOn={ref} />
      <svg viewBox="0 0 120 18" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength={1} d="M2 12 C30 6 70 4 118 9 C90 10 60 13 40 16" />
      </svg>
    </div>
  );
}

export function Foreword({
  outro,
  signer,
  seed,
  children,
}: {
  outro: string;
  signer: string;
  seed: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const outroRef = useRef<HTMLParagraphElement>(null);
  const outroShown = useReveal(outroRef, 0.6);
  const [taped, setTaped] = useState(false);
  const { style, crease } = layTapes(seed);
  const creaseStyle: CSSVars | undefined = crease && { "--d": `${crease.at}ms` };

  useEffect(() => {
    const sheet = ref.current;
    if (!sheet) return;
    let cancelled = false;
    const entrance = sheet
      .getAnimations({ subtree: true })
      .filter(animation => animation instanceof CSSAnimation && animation.animationName.startsWith("enter-"));
    Promise.allSettled(entrance.map(animation => animation.finished)).then(() => {
      if (!cancelled) setTaped(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      ref={ref}
      className="foreword enter"
      data-wide
      data-taped={taped || undefined}
      aria-label={`Foreword by ${signer}`}
      style={style}
    >
      {([0, 1] as const).map(tape => (
        <span key={tape} className={`foreword-tape foreword-tape-${tape === 0 ? "l" : "r"}`} aria-hidden="true">
          <svg viewBox="0 0 96 26" preserveAspectRatio="none">
            {crease?.tape === tape &&
              ["foreword-crease-hi", "foreword-crease-lo"].map(className => (
                <path key={className} className={className} pathLength={1} d={crease.d} style={creaseStyle} />
              ))}
          </svg>
        </span>
      ))}
      {children}
      <GuestHand>
        <p ref={outroRef} className="foreword-outro">
          <Handwriting text={outro} delay={0.1} shown={outroShown} />
        </p>
        <Signature name={signer} />
      </GuestHand>
    </section>
  );
}

export function Byline({
  name,
  href,
  color,
  children,
}: {
  name: string;
  href: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="byline">
      <a className="byline-avatar" href={href} tabIndex={-1} aria-hidden="true" style={{ background: color }} />
      <div>
        <a className="byline-name" href={href}>
          {name}
        </a>
        <div className="byline-role">{children}</div>
      </div>
    </div>
  );
}
