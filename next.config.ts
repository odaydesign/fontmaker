import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize bundle size for Netlify
  experimental: {
    optimizePackageImports: ['lucide-react', 'opentype.js', '@radix-ui/react-slider', '@radix-ui/react-tabs'],
  },
  // Reduce function size
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize large modules to reduce function bundle size
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        'sharp': 'commonjs sharp',
        'bcrypt': 'commonjs bcrypt',
      });
    }
    // Optimize chunks
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    return config;
  },
};

export default nextConfig;
