import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../tailwind.config";

const { theme } = resolveConfig(tailwindConfig);

export const colors = theme!.colors as {
  [key: string]: string | Record<string | number, string>;
};

export default theme;
