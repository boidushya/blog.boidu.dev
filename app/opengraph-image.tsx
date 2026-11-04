import { getAllBlogs } from "@/lib/blogs";
import { readImage } from "@/lib/image-source";
import { OG_SIZE, OG_TYPE, Wash, avatarDataUrl, ogImage, washDataUrl } from "@/lib/og";
import { SITE } from "@/utils/constants";
import sharp from "sharp";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = SITE.name;

const TILE = { width: 240, height: 135 };
const TILE_SPOTS = [
  [0, 0],
  [TILE.width, 0],
  [0, TILE.height],
  [TILE.width, TILE.height],
];

/** The site wash runs over a 2x2 collage of the post banners, so no single post owns the colour. */
async function bannerCollage() {
  const arts = (await getAllBlogs()).map(post => post.image);
  const tiles = await Promise.all(
    TILE_SPOTS.map((_, i) =>
      readImage(arts[i % arts.length]).then(image =>
        sharp(image)
          .resize({ ...TILE, fit: "fill" })
          .png()
          .toBuffer()
      )
    )
  );
  return sharp({ create: { width: TILE.width * 2, height: TILE.height * 2, channels: 3, background: "#000" } })
    .composite(tiles.map((input, i) => ({ input, left: TILE_SPOTS[i][0], top: TILE_SPOTS[i][1] })))
    .png()
    .toBuffer();
}

export default async function Image() {
  const [wash, avatar] = await Promise.all([bannerCollage().then(washDataUrl), avatarDataUrl()]);

  return ogImage(
    <>
      <Wash src={wash} dim={0.3} />
      <div style={{ position: "absolute", left: 64, right: 64, bottom: 104, display: "flex", flexDirection: "column" }}>
        <img
          src={avatar}
          alt=""
          width={120}
          height={120}
          style={{
            marginBottom: 36,
            borderRadius: "50%",
            boxShadow: "0 0 0 2px rgb(255 255 255 / 0.16), 0 20px 50px rgb(0 0 0 / 0.4)",
          }}
        />
        <div style={{ fontSize: 104, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.035em" }}>{SITE.name}</div>
        <div
          style={{
            marginTop: 30,
            maxWidth: 500,
            fontSize: 30,
            lineHeight: 1.3,
            color: "rgb(255 255 255 / 0.65)",
            textWrap: "balance",
          }}
        >
          {SITE.description}
        </div>
      </div>
    </>
  );
}
