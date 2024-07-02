import "@/styles/globals.css";
import Navbar from "./nav";
import Footer from "./footer";
import React from "react";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import { colors } from "@/utils/theme";
import Providers from "@/providers";

export const metadata = {
  title: "Boidu's Blog",
  description: "A blog where I write about my thoughts and experiences.",
  image: "https://i.ibb.co/RbdLBCb/og.png",
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
        <meta name="description" content={metadata.description} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:image" content={metadata.image} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://blog.boidu.dev" />
        <meta property="og:site_name" content={metadata.title} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@boidushya" />
        <meta name="twitter:creator" content="@boidushya" />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content={metadata.image} />
        <title>{metadata.title}</title>
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
