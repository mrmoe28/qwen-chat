import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Disable Turbopack - use Webpack via TURBOPACK=0 environment variable
  // Per project guidelines: NEVER use Turbopack
  // Set root directory to silence lockfile warning
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
