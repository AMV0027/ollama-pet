import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
  headers: async () => [
    {
      source: '/sprites/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
        {
          key: 'Content-Type',
          value: 'image/webp',
        },
      ],
    },
    {
      source: '/:path*.webmanifest',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400',
        },
      ],
    },
  ],
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;