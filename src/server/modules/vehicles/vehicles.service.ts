import type { VehicleCategory } from '@prisma/client';
import { prisma } from '../../db/prisma';

export async function getAvailableVehicles(params: {
  officeSlug: string;
  startDate: Date;
  endDate: Date;
  category?: VehicleCategory;
}) {
  const { officeSlug, startDate, endDate, category } = params;

  return prisma.vehicle.findMany({
    where: {
      isActive: true,
      office: { slug: officeSlug },
      ...(category ? { category } : {}),
      NOT: {
        reservations: {
          some: {
            status: { not: 'CANCELLED' },
            startDate: { lt: endDate },   // overlap: existing.start < requested.end
            endDate: { gt: startDate },   // overlap: existing.end   > requested.start
          },
        },
      },
    },
    include: {
      office: { select: { slug: true, city: true } },
    },
    orderBy: { dailyRate: 'asc' },
  });
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: { office: { select: { slug: true, city: true } } },
  });
}
