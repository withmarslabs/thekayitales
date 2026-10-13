import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
    qualities: [90],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
