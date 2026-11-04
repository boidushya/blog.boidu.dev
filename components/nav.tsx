"use client";

import PostSearch from "@/components/post-search";
import SoundToggle from "@/components/sound-toggle";
import ThemeSwitcher from "@/components/theme-switcher";
import { useResizeObserver } from "@/utils/hooks";
import { prefersReducedMotion } from "@/utils/motion";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useRef } from "react";

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

const SHIFT_MS = 400;
const HIDDEN = { width: 0, opacity: 0, filter: "blur(4px)", overflow: "hidden" };

function Collapse({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={HIDDEN}
      animate={{ width: "auto", opacity: 1, filter: "blur(0px)", transitionEnd: { overflow: "visible" } }}
      exit={HIDDEN}
      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
      className="shrink-0"
    >
      {children}
    </motion.div>
  );
}

function useWidthShift() {
  const last = useRef<{ edges: number[]; viewport: number; still: boolean } | null>(null);

  const shift = useCallback((nav: HTMLElement) => {
    const ends = Array.from(nav.children) as HTMLElement[];
    const navLeft = nav.getBoundingClientRect().left - nav.offsetLeft;
    const edges = ends.map((end, i) => navLeft + end.offsetLeft + (i ? end.offsetWidth : 0));
    // The pill and its return to the bar move the ends too; only a page width change between two settled bars slides them.
    const header = nav.parentElement;
    const still =
      header?.dataset.mode === "top" &&
      !header
        .getAnimations({ subtree: true })
        .some(animation => animation instanceof CSSTransition && !/color|shadow/.test(animation.transitionProperty));
    const previous = last.current;
    last.current = { edges, viewport: window.innerWidth, still };
    if (!previous || previous.viewport !== window.innerWidth || !still || !previous.still) return;
    if (prefersReducedMotion()) return;
    ends.forEach((end, i) => {
      const dx = previous.edges[i] - edges[i];
      if (dx)
        end.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], {
          duration: SHIFT_MS,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        });
    });
  }, []);

  return useResizeObserver<HTMLElement>(shift);
}

const Navbar = () => {
  const headerRef = useNavMode();
  const isHome = usePathname() === "/";
  const navRef = useWidthShift();

  return (
    <header ref={headerRef} data-mode="top" className="site-nav">
      <nav ref={navRef} className="flex items-center justify-between w-full py-5 mx-auto sm:py-8">
        <Link
          href="/"
          data-cuelume-navigate
          className="min-w-0 text-2xl font-bold tracking-tight truncate site-nav__logo text-accent-400"
        >
          Boidu's Blog
        </Link>

        <div className="flex items-center h-10">
          <AnimatePresence initial={false}>
            {isHome && (
              <Collapse key="search">
                <PostSearch />
              </Collapse>
            )}
          </AnimatePresence>
          <SoundToggle />
          <AnimatePresence initial={false}>
            {!isHome && (
              <Collapse key="theme">
                <div className="flex pl-2">
                  <ThemeSwitcher />
                </div>
              </Collapse>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
