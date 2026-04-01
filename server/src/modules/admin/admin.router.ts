import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { adminReservationsRouter } from './reservations/admin-reservations.router';

/**
 * Parent admin router. Applies JWT authentication to ALL routes registered here.
 * Mounted at /api/admin in server.ts.
 *
 * Add future admin sub-modules inside this function — they inherit auth automatically.
 */
export async function adminRouter(app: FastifyInstance) {
  // onRequest fires before body parsing — correct security posture for auth
  app.addHook('onRequest', authenticate);

  await app.register(adminReservationsRouter);
}
