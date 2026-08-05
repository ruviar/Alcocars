import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../db/prisma';

const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export async function adminClientsRouter(app: FastifyInstance) {
  // GET /api/admin/clients?search=&page=&pageSize=
  app.get('/clients', async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { search, page, pageSize } = parsed.data;
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [total, rows] = await prisma.$transaction([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { reservations: true } },
          reservations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { confirmationCode: true, status: true, createdAt: true, totalAmount: true },
          },
        },
      }),
    ]);

    return reply.send({
      total,
      page,
      pageSize,
      rows: rows.map((client) => ({
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        createdAt: client.createdAt,
        reservationCount: client._count.reservations,
        lastReservation: client.reservations[0] ?? null,
      })),
    });
  });
}
