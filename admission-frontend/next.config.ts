import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/admission-files/**',
      },
      {
        protocol: 'https',
        hostname: '**.minio.**',
        pathname: '/**',
      },
    ],
    // Disable image optimization for localhost development
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
