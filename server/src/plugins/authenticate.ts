import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Fastify preHandler / onRequest hook that verifies a Bearer JWT.
 * Reads the Authorization header via @fastify/jwt's request.jwtVerify().
 * Returns 401 if the token is missing, expired, or invalid.
 *
 * Usage: app.addHook('onRequest', authenticate)
 *     or route-level: { preHandler: authenticate }
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: 'UNAUTHORIZED' });
  }
}
