import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
const backendTarget = process.env.NEXT_PUBLIC_LOCAL_API_TARGET || "http://localhost:8002";

export default function nextConfig(phase) {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    experimental: {
      optimizePackageImports: ["lucide-react"],
    },
    async rewrites() {
      return [
        {
          source: "/uploads/:path*",
          destination: `${backendTarget}/uploads/:path*`,
        },
      ];
    },
  };
}
