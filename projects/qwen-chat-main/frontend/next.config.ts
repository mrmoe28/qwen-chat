import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Disable Turbopack - use Webpack via TURBOPACK=0 environment variable
  // Per project guidelines: NEVER use Turbopack
  // Set root directory to silence lockfile warning
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Ensure TypeScript path aliases work correctly
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  // Webpack configuration to ensure path aliases resolve correctly
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
