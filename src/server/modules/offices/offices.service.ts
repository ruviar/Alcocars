import { prisma } from '../../db/prisma';

export async function getAllOffices() {
  return prisma.office.findMany({
    orderBy: { city: 'asc' },
  });
}
