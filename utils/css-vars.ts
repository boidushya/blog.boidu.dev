import type { CSSProperties } from "react";

export type CSSVars<Value extends string | number = string | number> = CSSProperties & Record<`--${string}`, Value>;
