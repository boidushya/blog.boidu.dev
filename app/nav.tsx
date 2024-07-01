"use client";

import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import logo from "../assets/images/logo.jpg";

const _NavLink = ({ title, href }: { title: string; href: string }) => {
  const pathname = usePathname();
  const isActive = useMemo(() => pathname === href, [pathname, href]);

  return (
    <Link
      href={href}
      className={`text-base tracking-normal transition-colors hover:text-accent-100/80 ${
        isActive ? "text-accent-100/100" : "text-accent-100/50"
      }`}
    >
      {title}
    </Link>
  );
};

const Navbar: NextPage = () => {
  return (
    <div className="absolute left-0 z-10 w-full h-fit bg-gradient-to-b from-accent-900/100 via-accent-900/95 to-accent-900/90 backdrop-saturate-50 backdrop-brightness-75">
      <nav className="flex items-center justify-between w-[48rem] py-8 mx-auto my-0 ">
        <Link href="/" className="flex items-center gap-4 text-2xl font-bold tracking-tight text-accent-400">
          Boidu's Blog
        </Link>
        <div className="flex items-center gap-4"></div>
      </nav>
    </div>
  );
};

export default Navbar;
