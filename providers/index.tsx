"use client";

import { startSounds } from "@/utils/sounds";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { bind } from "cuelume";
import { MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const ThemeProvider = dynamic(() => import("../providers/theme"), {
  ssr: false,
});

const Providers = ({ children }: React.PropsWithChildren) => {
  useEffect(() => {
    const stopSounds = startSounds();
    const unbind = bind();
    return () => {
      stopSounds();
      unbind();
    };
  }, []);

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <TooltipProvider>{children}</TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  );
};

export default Providers;
