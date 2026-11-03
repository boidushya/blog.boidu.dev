import type React from "react";

export function Chapter({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div data-chapter={n} className="chapter">
      <div className="flex items-center gap-4 text-sm font-medium tabular-nums text-fg-subtle">
        {`Chapter ${n}`}
        <span aria-hidden="true" className="flex-1 h-px bg-accent-800" />
      </div>
      {children}
    </div>
  );
}
