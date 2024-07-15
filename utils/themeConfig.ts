import { THEMES, TThemeName } from "./constants";

type ThemeColors = (typeof THEMES)[TThemeName];
type ColorVariable = `--color-${keyof ThemeColors}`;

const hexToRgb = (hex: string | `#${string}`) => {
  hex = hex.replace(/^#/, "");

  let bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  return `${r} ${g} ${b}`;
};

export const getThemeVariables = (themeName: TThemeName): Record<ColorVariable, string> => {
  const theme = THEMES[themeName];
  return Object.entries(theme).reduce(
    (acc, [key, value]) => {
      const kebabKey = key.replace(/(accent)([0-9])/g, "$1-$2").toLowerCase();
      acc[`--color-${kebabKey}` as ColorVariable] = hexToRgb(value);
      return acc;
    },
    {} as Record<ColorVariable, string>
  );
};

export const getCurrentThemeColors = () => {
  const themeName = localStorage.getItem("blog-theme") as TThemeName;
  return getThemeVariables(themeName);
};

export const getThemeHint = (themeName: TThemeName) => {
  const theme = THEMES[themeName];

  return theme.accent500;
};

export const getAllThemes = () => Object.keys(THEMES) as TThemeName[];
