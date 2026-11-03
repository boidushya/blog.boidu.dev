"use client";

import SoundToggle from "@/components/sound-toggle";
import ThemeSwitcher from "@/components/theme-switcher";
import Link from "next/link";
import { useEffect, useRef } from "react";

type NavMode = "top" | "hidden" | "pill";

const SCROLL_INTENT_PX = 6;

/**
 * At the top the nav sits in the page and scrolls away with it. Out of view it becomes a pill off
 * screen, which slides in on any scroll up and out again on scroll down. Back at the top it settles
 * into the flat nav.
 */
function useNavMode() {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const setMode = (mode: NavMode, instant = false) => {
      if (header.dataset.mode === mode) return;
      if (mode !== "top" && header.dataset.mode === "top") header.style.height = `${header.offsetHeight}px`;
      if (instant) header.setAttribute("data-instant", "");
      header.dataset.mode = mode;
      if (mode === "top") header.style.height = "";
      if (instant) {
        void header.offsetWidth;
        requestAnimationFrame(() => header.removeAttribute("data-instant"));
      }
    };

    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const dy = y - last;
        last = y;
        const mode = header.dataset.mode as NavMode;
        if (y <= 2) setMode("top");
        else if (mode === "top") {
          if (y > header.offsetHeight + 24) setMode("hidden", true);
        } else if (mode === "pill" && dy > SCROLL_INTENT_PX) setMode("hidden");
        else if (mode === "hidden" && dy < -SCROLL_INTENT_PX) setMode("pill");
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return headerRef;
}

const Navbar = () => {
  const headerRef = useNavMode();

  return (
    <header ref={headerRef} data-mode="top" className="site-nav">
      <nav className="flex items-center justify-between w-full py-5 mx-auto sm:py-8">
        <Link
          href="/"
          data-cuelume-navigate
          className="text-2xl font-bold tracking-tight site-nav__logo text-accent-400"
        >
          Boidu's Blog
        </Link>

        <div className="flex items-center gap-2">
          <SoundToggle />
          <ThemeSwitcher />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
