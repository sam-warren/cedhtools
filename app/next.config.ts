import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "svgs.scryfall.io",
        pathname: "/card-symbols/**"
      }
    ]
  }
};

export default nextConfig;
