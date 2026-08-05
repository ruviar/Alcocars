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

    const result = await processContactForm(parsed.data);

    if (result.status === 'FAILED') {
      request.log.error({ error: result.error }, 'No se pudo enviar el aviso de contacto');
      return reply.status(502).send({ error: 'EMAIL_DELIVERY_FAILED' });
    }

    return reply.send({ ok: true, delivered: result.status === 'SENT' });
  });
}
