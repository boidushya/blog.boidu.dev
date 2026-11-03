"use client";

import { LIGHT_THEMES, TThemeName } from "@/utils/constants";
import { getThemeVariables } from "@/utils/themeConfig";
import React, { createContext, Dispatch, SetStateAction, useEffect, useLayoutEffect, useState } from "react";

export interface TThemeContext {
  theme: TThemeName;
  setTheme: Dispatch<SetStateAction<TThemeName>>;
}

export const defaultTheme = "obsidian";

export const ThemeContext = createContext<TThemeContext>({
  theme: defaultTheme,
  setTheme: () => {},
});

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<TThemeName>((localStorage.getItem("blog-theme") as TThemeName) || defaultTheme);

  useEffect(() => {
    const root = document.documentElement;
    const freeze = document.createElement("style");
    freeze.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.appendChild(freeze);
    const themeVariables = getThemeVariables(theme);
    Object.entries(themeVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    root.dataset.scheme = LIGHT_THEMES.includes(theme) ? "light" : "dark";
    // Recalculate styles while transitions are frozen, otherwise every color animates.
    window.getComputedStyle(root).color;
    requestAnimationFrame(() => freeze.remove());
    localStorage.setItem("blog-theme", theme);
  }, [theme]);

  useLayoutEffect(() => {
    const themeVariables = getThemeVariables(defaultTheme);
    Object.entries(themeVariables).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext) as TThemeContext;
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
