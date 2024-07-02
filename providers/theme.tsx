"use client";

import React, { createContext, Dispatch, SetStateAction, useEffect, useLayoutEffect, useState } from "react";
import { getThemeVariables } from "@/utils/themeConfig";
import { TThemeName } from "@/utils/constants";

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
    const themeVariables = getThemeVariables(theme);
    Object.entries(themeVariables).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
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
