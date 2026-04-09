import { prisma } from '../../../db/prisma';

/**
 * Returns all reservations with related client, vehicle, and office data,
 * ordered newest-first for the admin table view.
 */
export async function getAllReservations() {
  return prisma.reservation.findMany({
    include: {
      client: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
      vehicle: {
        select: { brand: true, name: true },
      },
      office: {
        select: { city: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
