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
  // Optimize bundle size
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', 'opentype.js'],
  },
  // Reduce function size
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        'sharp': 'commonjs sharp',
      });
    }
    return config;
  },
};

export default nextConfig;
