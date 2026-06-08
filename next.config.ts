// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.mlbstatic.com' },
      { protocol: 'https', hostname: 'securea.mlb.com' },
      { protocol: 'https', hostname: 'midfield.mlbstatic.com' },
    ],
  },

  // Vercel Cron Jobs — rescore every 60 seconds during game hours
  // Configured in vercel.json
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
      ],
    },
  ],

  redirects: async () => [
    { source: '/', destination: '/dashboard', permanent: false },
  ],
}

export default config
