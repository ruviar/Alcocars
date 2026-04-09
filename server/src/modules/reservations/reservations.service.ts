import type { ExtraType } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { generateConfirmationCode } from '../../utils/confirmationCode';

// Pricing constants — fixed for MVP
const EXTRAS_PRICING: Record<ExtraType, number> = {
  BABY_SEAT: 8,
  SNOW_CHAINS: 5,
  ADDITIONAL_DRIVER: 10,
};

export async function processCheckout(input: {
  vehicleId: string;
  officeSlug: string;
  startDate: Date;
  endDate: Date;
  extras: Array<{ key: ExtraType; quantity: number }>;
  client: { firstName: string; lastName: string; email: string; phone: string };
  notes?: string;
}) {
  const { vehicleId, officeSlug, startDate, endDate, extras, client, notes } = input;

  const extrasByType = extras.reduce((acc, extra) => {
    acc[extra.key] = (acc[extra.key] ?? 0) + extra.quantity;
    return acc;
  }, {} as Partial<Record<ExtraType, number>>);

  const totalDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (totalDays < 1) throw new Error('INVALID_DATE_RANGE');

  return prisma.$transaction(
    async (tx) => {
      // 1. Verify vehicle exists and is active
      const vehicle = await tx.vehicle.findFirst({
        where: { id: vehicleId, isActive: true },
      });
      if (!vehicle) throw new Error('VEHICLE_NOT_FOUND');

      const maxBabySeats = Math.max(vehicle.seats - 1, 0);
      if ((extrasByType.BABY_SEAT ?? 0) > maxBabySeats) {
        throw new Error('INVALID_BABY_SEAT_QUANTITY');
      }

      // 2. Check for any overlapping non-cancelled reservation
      //    Half-open interval: [startDate, endDate)
      //    Overlap iff: existing.startDate < requested.endDate AND existing.endDate > requested.startDate
      const conflict = await tx.reservation.findFirst({
        where: {
          vehicleId,
          status: { not: 'CANCELLED' },
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
      });
      if (conflict) throw new Error('VEHICLE_NOT_AVAILABLE');

      // 3. Resolve office
      const office = await tx.office.findUnique({ where: { slug: officeSlug } });
      if (!office) throw new Error('OFFICE_NOT_FOUND');

      // 4. Upsert client (same email = returning customer)
      const dbClient = await tx.client.upsert({
        where: { email: client.email },
        update: {
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
        },
        create: { ...client },
      });

      // 5. Compute pricing
      const dailyRate = Number(vehicle.dailyRate);
      const extrasData = (Object.keys(extrasByType) as ExtraType[]).map((type) => {
        const quantity = extrasByType[type] ?? 0;
        const pricePerDay = EXTRAS_PRICING[type];
        return {
          type,
          quantity,
          pricePerDay,
          totalPrice: pricePerDay * quantity * totalDays,
        };
      });
      const extrasTotal = extrasData.reduce((sum, e) => sum + e.totalPrice, 0);
      const totalAmount = dailyRate * totalDays + extrasTotal;

      // 6. Create the reservation + extras atomically
      const reservation = await tx.reservation.create({
        data: {
          confirmationCode: generateConfirmationCode(),
          vehicleId,
          clientId: dbClient.id,
          officeId: office.id,
          startDate,
          endDate,
          totalDays,
          dailyRate,
          extrasTotal,
          totalAmount,
          notes,
          extras: { create: extrasData },
        },
        include: { extras: true },
      });

      return {
        reservationId: reservation.id,
        confirmationCode: reservation.confirmationCode,
        totalAmount: reservation.totalAmount,
      };
    },
    { isolationLevel: 'Serializable' },
  );
}

export async function getReservationById(id: string) {
  return prisma.reservation.findUnique({
    where: { id },
    include: {
      vehicle: {
        select: { name: true, brand: true, imageUrl: true, dailyRate: true },
      },
      client: {
        select: { firstName: true, lastName: true, email: true },
      },
      office: {
        select: { city: true, address: true, phone: true },
      },
      extras: true,
    },
  });
}
