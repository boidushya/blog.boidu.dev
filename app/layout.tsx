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
