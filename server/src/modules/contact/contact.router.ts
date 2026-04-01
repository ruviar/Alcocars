import type { FastifyInstance } from 'fastify';
import { contactBodySchema } from './contact.schema';
import { processContactForm } from './contact.service';

export async function contactRouter(app: FastifyInstance) {
  app.post('/contact', async (request, reply) => {
    const parsed = contactBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    await processContactForm(parsed.data);
    return reply.send({ ok: true });
  });
}
