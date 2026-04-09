import type { FastifyInstance } from 'fastify';
import { listCategories } from './categories.service';

export async function categoriesRouter(fastify: FastifyInstance) {
  fastify.get('/categories', async (_request, reply) => {
    const categories = await listCategories();
    return reply.send(categories);
  });
}
