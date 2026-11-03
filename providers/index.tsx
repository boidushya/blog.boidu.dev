"use client";

import { TooltipProvider } from "@radix-ui/react-tooltip";
import { MotionConfig } from "motion/react";
import dynamic from "next/dynamic";

const ThemeProvider = dynamic(() => import("../providers/theme"), {
  ssr: false,
});

const Providers = ({ children }: React.PropsWithChildren) => {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <TooltipProvider>{children}</TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  );
};

export default Providers;
