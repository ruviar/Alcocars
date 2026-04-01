import type { FastifyInstance } from 'fastify';
import { loginBodySchema } from './auth.schema';
import { authenticateAdmin } from './auth.service';

export async function authRouter(app: FastifyInstance) {
  // POST /api/admin/login
  app.post('/login', async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const user = await authenticateAdmin(parsed.data.email, parsed.data.password);
    if (!user) {
      return reply.status(401).send({ error: 'INVALID_CREDENTIALS' });
    }

    const token = app.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '8h' },
    );

    return reply.send({ token, user });
  });
}
