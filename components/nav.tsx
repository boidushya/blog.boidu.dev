"use client";

import SoundToggle from "@/components/sound-toggle";
import ThemeSwitcher from "@/components/theme-switcher";
import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const _NavLink = ({ title, href }: { title: string; href: string }) => {
  const pathname = usePathname();
  const isActive = useMemo(() => pathname === href, [pathname, href]);

  return (
    <Link
      href={href}
      data-cuelume-navigate
      className={`text-base tracking-normal transition-colors hover:text-fg-muted ${
        isActive ? "text-accent-100" : "text-fg-subtle"
      }`}
    >
      {title}
    </Link>
  );
};

const Navbar: NextPage = () => {
  return (
    <nav className="left-0 z-10 flex items-center justify-between w-full py-5 sm:py-8 mx-auto my-0 h-fit sm:px-0">
      <Link
        href="/"
        data-cuelume-navigate
        className="flex items-center gap-4 text-2xl font-bold tracking-tight text-accent-400"
      >
        Boidu's Blog
      </Link>

      <div className="flex items-center gap-2">
        <SoundToggle />
        <ThemeSwitcher />
      </div>
    </nav>
  );
};

export default Navbar;
