import type { FastifyInstance } from 'fastify';
import { getAllReservations } from './admin-reservations.service';

export async function adminReservationsRouter(app: FastifyInstance) {
  // GET /api/admin/reservations — auth enforced by parent adminRouter
  app.get('/reservations', async (_request, reply) => {
    const reservations = await getAllReservations();
    return reply.send(reservations);
  });
}
