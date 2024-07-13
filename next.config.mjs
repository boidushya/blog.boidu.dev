/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "source.unsplash.com", "img.youtube.com", "res.cloudinary.com"],
  },
  webpack: config => {
    config.externals.push("utf-8-validate", "bufferutil");
    return config;
  },
};

export default nextConfig;
