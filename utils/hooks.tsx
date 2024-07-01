import { useEffect } from "react";

export const useWaterMark = () => {
  useEffect(() => {
    const styles = [
      "color: rgb(255 241 213)",
      "background: rgb(60 40 0)",
      "font-size: 10px",
      "font-weight: semibold",
      "border: 1px solid rgb(255 241 213)",
      "border-radius: 4px",
      "padding: 0.5rem 0.75rem",
    ].join(";");

    console.log("%cDev by Boidushya - https://boidu.dev", styles);
  }, []);
};
