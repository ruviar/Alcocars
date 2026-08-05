import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../db/prisma';

const listQuerySchema = z.object({
  status: z.enum(['SENT', 'FAILED', 'SKIPPED']).optional(),
  kind: z.enum(['BOOKING_ADMIN', 'BOOKING_CUSTOMER', 'CONTACT_ADMIN']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export async function adminEmailsRouter(app: FastifyInstance) {
  // GET /api/admin/email-logs?status=&kind=&page=&pageSize=
  app.get('/email-logs', async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { status, kind, page, pageSize } = parsed.data;
    const where = {
      ...(status ? { status } : {}),
      ...(kind ? { kind } : {}),
    };

    const [total, rows] = await prisma.$transaction([
      prisma.emailLog.count({ where }),
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          reservation: { select: { id: true, confirmationCode: true } },
        },
      }),
    ]);

    return reply.send({ total, page, pageSize, rows });
  });
}
