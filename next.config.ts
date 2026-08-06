import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // La API vive dentro de esta misma app (src/app/api): ya no hay backend
  // separado, ni proxy en desarrollo, ni CORS que configurar.
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
