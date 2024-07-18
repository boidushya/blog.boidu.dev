"use client";

import { useTheme } from "@/providers/theme";
import { TThemeName } from "@/utils/constants";
import { LIGHT_THEMES } from "@/utils/constants";
import { getAllThemes, getThemeHint } from "@/utils/themeConfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import React from "react";

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path d="M8 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 1ZM10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM12.95 4.11a.75.75 0 1 0-1.06-1.06l-1.062 1.06a.75.75 0 0 0 1.061 1.062l1.06-1.061ZM15 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 15 8ZM11.89 12.95a.75.75 0 0 0 1.06-1.06l-1.06-1.062a.75.75 0 0 0-1.062 1.061l1.061 1.06ZM8 12a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 12ZM5.172 11.89a.75.75 0 0 0-1.061-1.062L3.05 11.89a.75.75 0 1 0 1.06 1.06l1.06-1.06ZM4 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 4 8ZM4.11 5.172A.75.75 0 0 0 5.173 4.11L4.11 3.05a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
    <path d="M14.438 10.148c.19-.425-.321-.787-.748-.601A5.5 5.5 0 0 1 6.453 2.31c.186-.427-.176-.938-.6-.748a6.501 6.501 0 1 0 8.585 8.586Z" />
  </svg>
);

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const themes = getAllThemes();

  const isCurrentThemeLight = LIGHT_THEMES.includes(theme);

  const lightThemes = themes.filter(t => LIGHT_THEMES.includes(t));
  const darkThemes = themes.filter(t => !LIGHT_THEMES.includes(t));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 capitalize focus-visible:outline-none text-accent-400"
          aria-label="Select Theme"
        >
          <span className="pt-[1.5px]">{theme}</span>
          {isCurrentThemeLight ? <SunIcon /> : <MoonIcon />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          className="p-2 border rounded-lg shadow min-w-[10rem] bg-accent-900 border-accent-800/50 radix-dropdown__content"
          sideOffset={10}
          align="end"
        >
          <DropdownMenuLabel className="flex items-center justify-between gap-1 px-2 py-1 mb-0 text-xs text-accent-600">
            Dark
            <MoonIcon />
          </DropdownMenuLabel>

          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={t => {
              setTheme(t as TThemeName);
            }}
            className="flex flex-col gap-1 text-accent-300"
          >
            {darkThemes.map(t => (
              <DropdownMenuRadioItem
                key={t}
                className="p-2 px-3 flex items-center justify-between rounded-md text-sm capitalize data-[highlighted]:bg-accent-800/25 data-[highlighted]:text-accent-200 data-[state='checked']:bg-accent-800/50 data-[state='checked']:text-accent-100 cursor-pointer relative focus-visible:outline-none"
                value={t}
              >
                {t}
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor: getThemeHint(t),
                  }}
                />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator className="h-px my-2 bg-accent-800/50" />

          <DropdownMenuLabel className="flex items-center justify-between gap-1 px-1.5 py-1 mb-0 text-xs text-accent-600">
            Light
            <SunIcon />
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={t => {
              setTheme(t as TThemeName);
            }}
            className="flex flex-col gap-1 text-accent-300"
          >
            {lightThemes.map(t => (
              <DropdownMenuRadioItem
                key={t}
                className="p-2 px-3 flex items-center justify-between rounded-md text-sm capitalize data-[highlighted]:bg-accent-800/25 data-[highlighted]:text-accent-200 data-[state='checked']:bg-accent-800/50 data-[state='checked']:text-accent-100 cursor-pointer relative focus-visible:outline-none"
                value={t}
              >
                {t}
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor: getThemeHint(t),
                  }}
                />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
