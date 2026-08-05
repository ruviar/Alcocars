import type { FastifyInstance } from 'fastify';
import { getAdminStats } from './admin-stats.service';

export async function adminStatsRouter(app: FastifyInstance) {
  // GET /api/admin/stats
  app.get('/stats', async (_request, reply) => {
    return reply.send(await getAdminStats());
  });
}
