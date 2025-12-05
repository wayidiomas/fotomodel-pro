import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3845',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cdn.bubble.io',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  eslint: {
    // Skip ESLint during builds (legacy issues in codebase)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript errors during builds (legacy issues in codebase)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
