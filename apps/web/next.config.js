/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@financial-analyzer/shared', '@financial-analyzer/ui'],
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig