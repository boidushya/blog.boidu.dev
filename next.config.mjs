/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "source.unsplash.com",
      "img.youtube.com",
      "res.cloudinary.com",
      "avatars.githubusercontent.com",
      "api.dicebear.com",
    ],
  },
  webpack: config => {
    config.externals.push("utf-8-validate", "bufferutil");
    config.ignoreWarnings = [{ message: /Critical dependency: require function/ }];
    return config;
  },
};

export default nextConfig;
