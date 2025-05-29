import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_MAP_CLIENT_ID: process.env.NEXT_PUBLIC_MAP_CLIENT_ID,
    NEXT_PUBLIC_MAP_CLIENT_SECRET: process.env.NEXT_PUBLIC_MAP_CLIENT_SECRET,
  },
  typescript: {
	  ignoreBuildErrors: true,
  },
}

export default nextConfig;
