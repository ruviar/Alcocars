import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // En desarrollo, /api se proxya al backend Fastify local (como hacía Vite).
  // En producción el frontend llama directamente a NEXT_PUBLIC_API_BASE_URL.
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
