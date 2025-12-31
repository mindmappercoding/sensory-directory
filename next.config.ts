// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // ✅ allow next/image to render Cloudinary-hosted images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
