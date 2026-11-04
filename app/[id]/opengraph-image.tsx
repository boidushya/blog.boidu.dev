import { getAllBlogs } from "@/lib/blogs";
import { readImage } from "@/lib/image-source";
import { OG_SIZE, OG_TYPE, Wash, avatarDataUrl, imageDataUrl, ogImage, washDataUrl } from "@/lib/og";
import { SITE } from "@/utils/constants";
import type { CSSProperties } from "react";

export const size = OG_SIZE;
export const contentType = OG_TYPE;

export async function generateStaticParams() {
  return (await getAllBlogs()).map(post => ({ id: post.id }));
}

const line: CSSProperties = {
  padding: "16px 0",
  fontSize: 54,
  fontWeight: 600,
  lineHeight: 1.1,
  letterSpacing: "-0.025em",
  textWrap: "balance",
};
const neighbour: CSSProperties = { ...line, opacity: 0.28, filter: "blur(3.5px)" };

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posts = await getAllBlogs();
  const index = posts.findIndex(post => post.id === id);
  const post = posts[index];
  const older = posts[index + 1];
  const newer = older ? undefined : posts[index - 1];
  const art = await readImage(post.image);
  const [wash, avatar] = await Promise.all([washDataUrl(art), avatarDataUrl()]);
  const cover = imageDataUrl(art);

  return ogImage(
    <>
      <Wash src={wash} dim={post.dim} />
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 22,
          fontWeight: 600,
          color: "rgb(255 255 255 / 0.6)",
        }}
      >
        <img
          src={avatar}
          alt=""
          width={36}
          height={36}
          style={{ borderRadius: "50%", boxShadow: "0 0 0 1.5px rgb(255 255 255 / 0.16)" }}
        />
        {SITE.name}
      </div>
      <div
        style={{
          position: "absolute",
          top: 104,
          left: 64,
          right: 64,
          bottom: 96,
          display: "flex",
          gap: 72,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 452, flexShrink: 0 }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 452,
              height: 254,
              borderRadius: 16,
              overflow: "hidden",
              background: "#0d0e12",
              boxShadow: "0 30px 70px rgb(0 0 0 / 0.45), 0 2px 6px rgb(0 0 0 / 0.3)",
            }}
          >
            <img src={cover} alt="" width={452} height={254} style={{ objectFit: "cover" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 16,
                boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.1)",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontFamily: "Caveat", fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{post.short}</div>
            <div style={{ display: "flex", fontSize: 18, lineHeight: 1.3, color: "rgb(255 255 255 / 0.5)" }}>
              {post.labels.map((label, i) => (
                <span key={label} style={{ display: "flex" }}>
                  {i > 0 && <span style={{ margin: "0 0.35em" }}>·</span>}
                  <span style={i === 0 ? { fontWeight: 500, color: "rgb(255 255 255 / 0.85)" } : undefined}>
                    {label}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: 26,
              padding: "0 8px",
              borderRadius: 7,
              background: "rgb(255 255 255 / 0.16)",
              fontSize: 13,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: "rgb(255 255 255 / 0.85)",
            }}
          >
            <span>0:00</span>
            <span>{post.minutes}:00</span>
          </div>
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            flex: 1,
            height: "100%",
            maskImage: "linear-gradient(transparent, #000 12%, #000 78%, transparent)",
          }}
        >
          <div
            style={{ position: "absolute", left: 0, right: 0, top: "30%", display: "flex", flexDirection: "column" }}
          >
            {newer && (
              <div style={{ ...neighbour, position: "absolute", left: 0, right: 0, bottom: "100%" }}>{newer.title}</div>
            )}
            <div style={line}>{post.title}</div>
            {older && <div style={neighbour}>{older.title}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
