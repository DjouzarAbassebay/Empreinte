import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tout est personnalisé (session, progression), donc rendu dynamique partout.
  cacheComponents: false,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
