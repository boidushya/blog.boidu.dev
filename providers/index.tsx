"use client";

import { getSoundsEnabled } from "@/utils/sounds";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { bind, setEnabled } from "cuelume";
import { MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const ThemeProvider = dynamic(() => import("../providers/theme"), {
  ssr: false,
});

const Providers = ({ children }: React.PropsWithChildren) => {
  useEffect(() => {
    setEnabled(getSoundsEnabled());
    return bind();
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
