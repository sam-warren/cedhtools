import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cards.scryfall.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "c1.scryfall.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.moxfield.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
