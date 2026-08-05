import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/authenticate';
import { adminClientsRouter } from './clients/admin-clients.router';
import { adminEmailsRouter } from './emails/admin-emails.router';
import { adminReservationsRouter } from './reservations/admin-reservations.router';
import { adminStatsRouter } from './stats/admin-stats.router';
import { adminVehiclesRouter } from './vehicles/admin-vehicles.router';

/**
 * Parent admin router. Applies JWT authentication to ALL routes registered here.
 * Mounted at /api/admin in server.ts.
 *
 * Add future admin sub-modules inside this function — they inherit auth automatically.
 */
export async function adminRouter(app: FastifyInstance) {
  // onRequest fires before body parsing — correct security posture for auth
  app.addHook('onRequest', authenticate);

  await app.register(adminStatsRouter);
  await app.register(adminReservationsRouter);
  await app.register(adminVehiclesRouter);
  await app.register(adminEmailsRouter);
  await app.register(adminClientsRouter);
}
