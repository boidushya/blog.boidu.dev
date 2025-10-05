import "@/styles/globals.css";
import Footer from "@/components/footer";
import Navbar from "@/components/nav";
import Providers from "@/providers";
import { colors } from "@/utils/theme";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import React from "react";

export const metadata = {
  title: "Boidu's Blog",
  description: "A blog where I write about my thoughts and experiences.",
  openGraph: {
    title: "Boidu's Blog",
    description: "A blog where I write about my thoughts and experiences.",
    url: "https://blog.boidu.dev",
    siteName: "blog.boidu.dev",
    images: [
      {
        url: "https://i.ibb.co/RbdLBCb/og.png",
        width: 1200,
        height: 900,
        alt: "Boidu's Blog",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@boidushya",
    creator: "@boidushya",
    title: "Boidu's Blog",
    description: "A blog where I write about my thoughts and experiences.",
    images: ["https://i.ibb.co/RbdLBCb/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const topLoaderColor = colors.accent[600] as string;
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="hsxkLtNCoahD0HV2cRmDi9op-0LMgf7wPrcehV7vEyU" />
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="de3af0e1-5059-4da8-82ff-0129a817a658"
        ></script>
      </head>
      <body>
        <main className="relative max-w-3xl px-4 mx-auto sm:px-0">
          <Providers>
            <NextTopLoader color={topLoaderColor} />
            <Navbar />
            {children}
            <Footer />
          </Providers>
        </main>
      </body>
      <Script src="/static/script.js"></Script>
    </html>
  );
}
