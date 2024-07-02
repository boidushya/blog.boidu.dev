import { TooltipProvider } from "@radix-ui/react-tooltip";
import dynamic from "next/dynamic";

const ThemeProvider = dynamic(() => import("../providers/theme"), {
  ssr: false,
});

const Providers = ({ children }: React.PropsWithChildren) => {
  return (
    <ThemeProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
};

export default Providers;
