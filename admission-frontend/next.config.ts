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
    // Force unoptimized to true to show original URLs (MinIO port 9000)
    // and avoid Docker internal resolution issues
    unoptimized: true,
  },
};

export default nextConfig;
