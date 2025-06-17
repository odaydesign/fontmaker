import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXTAUTH_SECRET: "your-super-secret-nextauth-key-for-development-only-change-in-production",
    NEXTAUTH_URL: "http://localhost:3000",
  },
};

export default nextConfig;
