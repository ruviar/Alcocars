import { prisma } from '../../../db/prisma';

/**
 * Returns all reservations with related client, category, and office data,
 * ordered newest-first for the admin table view.
 */
export async function getAllReservations() {
  return prisma.reservation.findMany({
    include: {
      client: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
      category: {
        select: { name: true, slug: true },
      },
      office: {
        select: { city: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
