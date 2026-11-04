import { Caveat } from "next/font/google";
import localFont from "next/font/local";

// Fills glyphs boidoodle nova lacks (accents, dashes) and writes a guest's foreword.
export const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

// One weight drawn by hand, declared across the whole range so bold rules never get a faux bold.
export const boidoodleNova = localFont({
  src: [{ path: "../public/fonts/boidoodle-nova.woff2", weight: "100 900" }],
  adjustFontFallback: false,
  fallback: ["var(--font-caveat)"],
});
