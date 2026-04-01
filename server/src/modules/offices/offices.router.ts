import type { FastifyInstance } from 'fastify';
import { getAllOffices } from './offices.service';

export async function officesRouter(app: FastifyInstance) {
  app.get('/offices', async (_request, reply) => {
    const offices = await getAllOffices();
    return reply.send(offices);
  });
}
