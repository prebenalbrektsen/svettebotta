import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Proof photos are resized in the browser, but leave room for a big phone screenshot.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
