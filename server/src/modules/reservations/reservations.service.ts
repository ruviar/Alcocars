import type { ExtraType } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { generateConfirmationCode } from '../../utils/confirmationCode';
import { computePrice } from '../../lib/pricing';
import { sendClientConfirmation, sendAdminNotification } from '../../lib/mailer';

// Pricing constants — extras only (base rate now from Category table)
const EXTRAS_PRICING: Record<ExtraType, number> = {
  BABY_SEAT: 8,
  SNOW_CHAINS: 5,
  ADDITIONAL_DRIVER: 10,
};

export async function processCheckout(input: {
  categoryId: string;
  officeSlug: string;
  startDate: Date;
  endDate: Date;
  estimatedKm: number;
  extras: Array<{ key: ExtraType; quantity: number }>;
  client: { firstName: string; lastName: string; email: string; phone: string };
  notes?: string;
}) {
  const { categoryId, officeSlug, startDate, endDate, estimatedKm, extras, client, notes } = input;

  const extrasByType = extras.reduce((acc, extra) => {
    acc[extra.key] = (acc[extra.key] ?? 0) + extra.quantity;
    return acc;
  }, {} as Partial<Record<ExtraType, number>>);

  const totalDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (totalDays < 1) throw 'INVALID_DATE_RANGE';

  const reservation = await prisma.$transaction(
    async (tx) => {
      // 1. Verify category exists and is active
      const category = await tx.category.findFirst({
        where: { id: categoryId, isActive: true },
      });
      if (!category) throw 'CATEGORY_NOT_FOUND';

      // 2. Resolve office
      const office = await tx.office.findUnique({ where: { slug: officeSlug } });
      if (!office) throw 'OFFICE_NOT_FOUND';

      // 3. Upsert client (same email = returning customer)
      const dbClient = await tx.client.upsert({
        where: { email: client.email },
        update: { firstName: client.firstName, lastName: client.lastName, phone: client.phone },
        create: { ...client },
      });

      // 4. Compute extras
      const extrasData = (Object.keys(extrasByType) as ExtraType[]).map((type) => {
        const quantity = extrasByType[type] ?? 0;
        const pricePerDay = EXTRAS_PRICING[type];
        return { type, quantity, pricePerDay, totalPrice: pricePerDay * quantity * totalDays };
      });
      const extrasTotal = extrasData.reduce((sum, e) => sum + e.totalPrice, 0);

      // 5. Compute price breakdown using fixed rate table
      const rates = {
        price1Day: Number(category.price1Day),
        price2Day: Number(category.price2Day),
        price3Day: Number(category.price3Day),
        price4Day: Number(category.price4Day),
        price5Day: Number(category.price5Day),
        price6Day: Number(category.price6Day),
        price7Day: Number(category.price7Day),
        extraKmRate: Number(category.extraKmRate),
        deposit: Number(category.deposit),
        franchise: Number(category.franchise),
      };
      const breakdown = computePrice({ category: rates, days: totalDays, estimatedKm, extrasTotal });

      // 6. Create reservation atomically
      const created = await tx.reservation.create({
        data: {
          confirmationCode: generateConfirmationCode(),
          categoryId,
          clientId: dbClient.id,
          officeId: office.id,
          startDate,
          endDate,
          totalDays,
          estimatedKm,
          includedKm: breakdown.includedKm,
          extraKm: breakdown.extraKm,
          baseRate: breakdown.baseRate,
          extraKmCharge: breakdown.extraKmCharge,
          extrasTotal: breakdown.extrasTotal,
          depositHeld: breakdown.deposit,
          franchiseAmount: breakdown.franchise,
          totalAmount: breakdown.totalAmount,
          notes,
          extras: { create: extrasData },
        },
        include: {
          extras: true,
          category: { select: { name: true, slug: true } },
          office: { select: { city: true, address: true, phone: true } },
          client: { select: { firstName: true, lastName: true, email: true } },
        },
      });

      return created;
    },
    { isolationLevel: 'Serializable' },
  );

  // 7. Send emails OUTSIDE transaction (non-blocking — log on failure, don't throw)
  try {
    await Promise.all([
      sendClientConfirmation(reservation),
      sendAdminNotification(reservation),
    ]);
  } catch (err) {
    console.error('[mailer] Failed to send confirmation emails:', err);
  }

  return {
    reservationId: reservation.id,
    confirmationCode: reservation.confirmationCode,
    totalAmount: Number(reservation.totalAmount),
  };
}

export async function getReservationById(id: string) {
  return prisma.reservation.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true, imageUrl: true } },
      client: { select: { firstName: true, lastName: true, email: true } },
      office: { select: { city: true, address: true, phone: true } },
      extras: true,
    },
  });
}
