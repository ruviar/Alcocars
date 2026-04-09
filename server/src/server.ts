import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './config/env';
import { officesRouter } from './modules/offices/offices.router';
import { vehiclesRouter } from './modules/vehicles/vehicles.router';
import { reservationsRouter } from './modules/reservations/reservations.router';
import { contactRouter } from './modules/contact/contact.router';
import { authRouter } from './modules/admin/auth/auth.router';
import { adminRouter } from './modules/admin/admin.router';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport:
        env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // CORS — origins from CORS_ORIGIN env var (comma-separated list)
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // JWT — decorates request.jwtVerify() and app.jwt.sign()
  await app.register(jwt, { secret: env.JWT_SECRET });

  // Health check
  app.get('/api/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  // Public API routes
  await app.register(officesRouter, { prefix: '/api' });
  await app.register(vehiclesRouter, { prefix: '/api' });
  await app.register(reservationsRouter, { prefix: '/api' });
  await app.register(contactRouter, { prefix: '/api' });

  // Admin — auth login (public)
  await app.register(authRouter, { prefix: '/api/admin' });

  // Admin — protected backoffice routes
  await app.register(adminRouter, { prefix: '/api/admin' });

  return app;
}

// Only start server when run directly (not when imported by tests)
if (require.main === module) {
  buildApp().then((app) => {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

    app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        console.error('Error arrancando el servidor:', err);
        process.exit(1);
      }
      console.log(`Servidor escuchando en ${address}`);
    });
  });
}
