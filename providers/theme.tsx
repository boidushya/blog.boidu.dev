"use client";

import { LIGHT_THEMES, TThemeName } from "@/utils/constants";
import { getThemeVariables } from "@/utils/themeConfig";
import React, { createContext, useEffect, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";

export interface TThemeContext {
  theme: TThemeName;
  switchTheme: (next: TThemeName, origin: { x: number; y: number }) => void;
}

export const defaultTheme = "obsidian";

export const ThemeContext = createContext<TThemeContext>({
  theme: defaultTheme,
  switchTheme: () => {},
});

function applyTheme(theme: TThemeName) {
  const root = document.documentElement;
  const freeze = document.createElement("style");
  freeze.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(freeze);
  Object.entries(getThemeVariables(theme)).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  root.dataset.scheme = LIGHT_THEMES.includes(theme) ? "light" : "dark";
  // Recalculate styles while transitions are frozen, otherwise every color animates.
  window.getComputedStyle(root).color;
  requestAnimationFrame(() => freeze.remove());
}

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<TThemeName>((localStorage.getItem("blog-theme") as TThemeName) || defaultTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("blog-theme", theme);
  }, [theme]);

  const switchTheme = (next: TThemeName, origin: { x: number; y: number }) => {
    const apply = () => {
      applyTheme(next);
      flushSync(() => setTheme(next));
    };
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
    const root = document.documentElement.style;
    root.setProperty("--theme-x", `${origin.x}px`);
    root.setProperty("--theme-y", `${origin.y}px`);
    root.setProperty(
      "--theme-r",
      `${Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y))}px`
    );
    document.startViewTransition(apply).ready.catch((error: unknown) => {
      // A second switch mid-reveal skips this one, which rejects `ready` with an AbortError.
      if (!(error instanceof DOMException && error.name === "AbortError")) console.error(error);
    });
  };

  useLayoutEffect(() => {
    const themeVariables = getThemeVariables(defaultTheme);
    Object.entries(themeVariables).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, switchTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext) as TThemeContext;
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
