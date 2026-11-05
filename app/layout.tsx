import "@/styles/globals.css";
import Footer from "@/components/footer";
import Navbar from "@/components/nav";
import { PageWash } from "@/components/wash";
import Providers from "@/providers";
import { SITE } from "@/utils/constants";
import { caveat } from "@/utils/fonts";
import { colors } from "@/utils/theme";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import React from "react";

export const viewport: Viewport = { viewportFit: "cover" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.name,
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    siteName: SITE.host,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    creator: SITE.twitter,
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
      <body className={caveat.variable}>
        <div className="site relative box-content max-w-3xl px-4 mx-auto sm:px-6">
          <Providers>
            <NextTopLoader color={topLoaderColor} />
            <PageWash />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </Providers>
        </div>
      </body>
      <Script src="/static/script.js"></Script>
    </html>
  );
}
