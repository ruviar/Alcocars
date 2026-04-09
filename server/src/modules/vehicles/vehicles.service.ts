import { prisma } from '../../db/prisma';

export async function getAvailableVehicles(params: {
  officeSlug: string;
  startDate: Date;
  endDate: Date;
}) {
  const { officeSlug } = params;

  return prisma.vehicle.findMany({
    where: {
      isActive: true,
      office: { slug: officeSlug },
    },
    include: {
      office: { select: { slug: true, city: true } },
      category: { select: { slug: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: {
      office: { select: { slug: true, city: true } },
      category: { select: { slug: true, name: true } },
    },
  });
}
