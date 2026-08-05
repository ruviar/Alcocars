import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../db/prisma';

const listQuerySchema = z.object({
  officeSlug: z.string().optional(),
  category: z.enum(['TURISMOS', 'FURGONETAS', 'SUV_4X4', 'AUTOCARAVANAS']).optional(),
  /** por defecto se listan también las unidades desactivadas */
  onlyActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

const toggleBodySchema = z.object({
  isActive: z.boolean(),
});

export async function adminVehiclesRouter(app: FastifyInstance) {
  // GET /api/admin/vehicles?officeSlug=&category=&onlyActive=
  app.get('/vehicles', async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { officeSlug, category, onlyActive } = parsed.data;
    const now = new Date();

    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(officeSlug ? { office: { slug: officeSlug } } : {}),
        ...(category ? { category } : {}),
        ...(onlyActive ? { isActive: true } : {}),
      },
      include: {
        office: { select: { slug: true, city: true } },
        _count: {
          select: {
            reservations: {
              where: { status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] }, endDate: { gte: now } },
            },
          },
        },
      },
      orderBy: [{ office: { city: 'asc' } }, { category: 'asc' }, { brand: 'asc' }],
    });

    return reply.send(
      vehicles.map((vehicle) => ({
        id: vehicle.id,
        slug: vehicle.slug,
        brand: vehicle.brand,
        name: vehicle.name,
        category: vehicle.category,
        seats: vehicle.seats,
        fuel: vehicle.fuel,
        transmission: vehicle.transmission,
        isActive: vehicle.isActive,
        office: vehicle.office,
        openReservations: vehicle._count.reservations,
      })),
    );
  });

  // PATCH /api/admin/vehicles/:id  { isActive }
  app.patch<{ Params: { id: string } }>('/vehicles/:id', async (request, reply) => {
    const parsed = toggleBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: request.params.id } });
    if (!vehicle) return reply.status(404).send({ error: 'VEHICLE_NOT_FOUND' });

    const updated = await prisma.vehicle.update({
      where: { id: request.params.id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, isActive: true },
    });

    return reply.send(updated);
  });
}
