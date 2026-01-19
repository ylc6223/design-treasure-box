import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.thepexels.top',
        pathname: '/screenshots/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Read port from environment variable
  env: {
    PORT: process.env.PORT || '3000',
  },
}

export default nextConfig
