"use client";

import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

type Layers = { front: 0 | 1; content: [string[], string[]]; animate: boolean };

const sameUnits = (a: string[], b: string[]) => a.length === b.length && a.every((unit, i) => unit === b[i]);

const unitStyle = (i: number): CSSProperties & { "--i": number } => ({ "--i": i });

export function PipLine({
  units,
  delay = 0,
  instant = false,
  className,
  renderUnit = unit => unit,
}: {
  units: string[];
  delay?: number;
  instant?: boolean;
  className?: string;
  renderUnit?: (unit: string, i: number) => ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [layers, setLayers] = useState<Layers>({ front: 0, content: [units, []], animate: false });

  const shown = layers.content[layers.front];
  if (!sameUnits(shown, units)) {
    setLayers({
      front: layers.front === 0 ? 1 : 0,
      content: layers.front === 0 ? [shown, units] : [units, shown],
      animate: !instant,
    });
  }

  useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;
    clearTimeout(timer.current);
    if (!layers.animate) {
      row.removeAttribute("data-swapping");
      return;
    }
    row.setAttribute("data-swapping", "false");
    void row.offsetWidth;
    row.style.setProperty("--line-delay", `${delay}ms`);
    row.setAttribute("data-swapping", "true");
    const count = layers.content[layers.front].length;
    timer.current = setTimeout(() => row.removeAttribute("data-swapping"), 620 + count * 45 + delay + 50);
  }, [layers, delay]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <span ref={ref} className={className ? `pip-line ${className}` : "pip-line"}>
      {layers.content.map((layer, n) => (
        <span key={n} className="pip-layer" data-front={String(layers.front === n)}>
          {layer.map((unit, i) => (
            <span key={i} className="pip-unit" style={unitStyle(i)}>
              {renderUnit(unit, i)}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function RollingText({ text, delay, instant }: { text: string; delay?: number; instant?: boolean }) {
  return Array.from(text, (char, i) => <PipLine key={i} units={[char]} delay={delay} instant={instant} />);
}
