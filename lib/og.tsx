import fs from "fs";
import { join } from "path";
import { kawarpFrame } from "@/lib/kawarp-frame";
import { WASH_BASE } from "@/utils/constants";
import type { CSSProperties, ReactNode } from "react";
import { googleFonts } from "takumi-js/helpers";
import { ImageResponse } from "takumi-js/response";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/jpeg";

const toDataUrl = (data: Buffer, type: string) => `data:${type};base64,${data.toString("base64")}`;

export const imageDataUrl = (data: Buffer) => toDataUrl(data, data[0] === 0x89 ? "image/png" : "image/jpeg");

export const avatarDataUrl = () =>
  fs.promises.readFile(join(process.cwd(), "assets/images/logo.jpg")).then(data => toDataUrl(data, "image/jpeg"));

export async function washDataUrl(image: Buffer) {
  return toDataUrl(await kawarpFrame(image, OG_SIZE.width, OG_SIZE.height), "image/png");
}

/** The Kawarp wash under a card, dimmed the way the homepage dims it. */
export function Wash({ src, dim }: { src: string; dim: number }) {
  const fill: CSSProperties = { position: "absolute", top: 0, left: 0, ...OG_SIZE };
  return (
    <>
      <img src={src} alt="" style={fill} />
      <div style={{ ...fill, background: WASH_BASE, opacity: dim }} />
    </>
  );
}

const diatype = fs.promises.readFile(join(process.cwd(), "public/fonts/ABCDiatypeRoundedVariable.woff2"));
const boidoodleNovaData = fs.promises.readFile(join(process.cwd(), "public/fonts/boidoodle-nova.woff2"));

/** `boidoodleNova` loads boidoodle nova with Caveat as its fallback, for cards that write a title by hand. */
export async function ogImage(node: ReactNode, { boidoodleNova = false } = {}) {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: WASH_BASE,
        color: "#f6f7f9",
        fontFamily: "Diatype",
      }}
    >
      {node}
    </div>,
    {
      ...OG_SIZE,
      format: "jpeg",
      quality: 90,
      fonts: [
        { name: "Diatype", data: await diatype },
        ...(boidoodleNova
          ? [
              { name: "boidoodle-nova", data: await boidoodleNovaData, weight: 700 },
              ...(await googleFonts([{ name: "Caveat", weight: 700 }])),
            ]
          : []),
      ],
    }
  );
}
