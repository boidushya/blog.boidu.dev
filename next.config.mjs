/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      "images.unsplash.com",
      "source.unsplash.com",
      "img.youtube.com",
      "res.cloudinary.com",
      "avatars.githubusercontent.com",
      "api.dicebear.com",
      "composer.betterlyrics.org",
    ].map(hostname => ({ protocol: "https", hostname })),
    qualities: [75, 100],
  },
  serverExternalPackages: ["utf-8-validate", "bufferutil"],
  agentRules: false,
};

export default nextConfig;
