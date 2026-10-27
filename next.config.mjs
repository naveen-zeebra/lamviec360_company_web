/** @type {import('next').NextConfig} */
const backendTarget = process.env.NEXT_PUBLIC_LOCAL_API_TARGET || "http://localhost:8002";

const nextConfig = {
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

export default nextConfig;
