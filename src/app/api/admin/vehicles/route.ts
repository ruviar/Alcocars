import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/db/prisma';
import { parseQuery, requireAdmin, withErrorLogging } from '../../../../server/http';

const listQuerySchema = z.object({
  officeSlug: z.string().optional(),
  category: z.enum(['TURISMOS', 'FURGONETAS', 'SUV_4X4', 'AUTOCARAVANAS']).optional(),
  /** por defecto se listan también las unidades desactivadas */
  onlyActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const GET = withErrorLogging(async (request) => {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const parsed = parseQuery(request, listQuerySchema);
  if ('response' in parsed) return parsed.response;

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

  return NextResponse.json(
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
