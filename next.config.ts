import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Neon requires the WebSocket polyfill for serverless environments
  serverExternalPackages: ['@neondatabase/serverless'],
  // Required for drizzle-kit
  experimental: {},
};

export default nextConfig;
