import type { ExtraType, VehicleCategory } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { generateConfirmationCode } from '../../utils/confirmationCode';
import { sendBookingEmails } from '../../utils/mailer';
import {
  CATEGORY_ORDER,
  MAX_RENTAL_DAYS,
  getCategoryExtraKmMultiplier,
  getCategoryTariff,
  getExtraKmRate,
  getIncludedKm,
  roundCurrency,
} from './renting.config';

// Pricing constants — fixed for MVP
const EXTRAS_PRICING: Record<ExtraType, number> = {
  BABY_SEAT: 8,
  SNOW_CHAINS: 5,
  ADDITIONAL_DRIVER: 10,
};

function getTotalDays(startDate: Date, endDate: Date): number {
  return Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function parsePowerValue(power: string): number | null {
  const match = power.match(/(\d+)/);
  if (!match) return null;

  const value = Number.parseInt(match[1], 10);
  if (Number.isNaN(value)) return null;

  return value;
}

function formatPowerRange(minPower: number | null, maxPower: number | null): string {
  if (minPower === null || maxPower === null) {
    return 'Potencia según disponibilidad';
  }
  if (minPower === maxPower) {
    return `${minPower} cv`;
  }

  return `${minPower} cv - ${maxPower} cv`;
}

function formatSeatsRange(minSeats: number, maxSeats: number): string {
  if (minSeats === maxSeats) {
    return `${minSeats} plazas`;
  }

  return `${minSeats}-${maxSeats} plazas`;
}

export type AvailableCategoryOffer = {
  category: VehicleCategory;
  availableUnits: number;
  powerRange: string;
  seatsRange: string;
  safeBabySeatMax: number;
  pricing: {
    totalDays: number;
    basePrice: number;
    includedKm: number;
    extraKmRate: number;
    extraKmMultiplier: number;
  };
};

export async function getAvailableCategoryOffers(params: {
  officeSlug: string;
  startDate: Date;
  endDate: Date;
}): Promise<AvailableCategoryOffer[]> {
  const { officeSlug, startDate, endDate } = params;

  const totalDays = getTotalDays(startDate, endDate);
  if (totalDays < 1) throw new Error('INVALID_DATE_RANGE');
  if (totalDays > MAX_RENTAL_DAYS) throw new Error('MAX_RENTAL_DAYS_EXCEEDED');

  const office = await prisma.office.findUnique({ where: { slug: officeSlug } });
  if (!office) throw new Error('OFFICE_NOT_FOUND');

  const availableVehicles = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      officeId: office.id,
      NOT: {
        reservations: {
          some: {
            status: { not: 'CANCELLED' },
            startDate: { lt: endDate },
            endDate: { gt: startDate },
          },
        },
      },
    },
    select: {
      category: true,
      power: true,
      seats: true,
    },
  });

  const grouped = new Map<VehicleCategory, Array<{ power: string; seats: number }>>();

  for (const vehicle of availableVehicles) {
    const group = grouped.get(vehicle.category) ?? [];
    group.push({ power: vehicle.power, seats: vehicle.seats });
    grouped.set(vehicle.category, group);
  }

  return CATEGORY_ORDER.flatMap((category) => {
    const categoryVehicles = grouped.get(category);
    if (!categoryVehicles || categoryVehicles.length === 0) {
      return [];
    }

    const basePrice = getCategoryTariff(category, totalDays);
    if (basePrice === null) {
      return [];
    }

    const seats = categoryVehicles.map((v) => v.seats);
    const minSeats = Math.min(...seats);
    const maxSeats = Math.max(...seats);

    const powers = categoryVehicles
      .map((vehicle) => parsePowerValue(vehicle.power))
      .filter((value): value is number => value !== null);

    const minPower = powers.length > 0 ? Math.min(...powers) : null;
    const maxPower = powers.length > 0 ? Math.max(...powers) : null;

    return [
      {
        category,
        availableUnits: categoryVehicles.length,
        powerRange: formatPowerRange(minPower, maxPower),
        seatsRange: formatSeatsRange(minSeats, maxSeats),
        safeBabySeatMax: Math.max(minSeats - 1, 0),
        pricing: {
          totalDays,
          basePrice,
          includedKm: getIncludedKm(totalDays),
          extraKmRate: getExtraKmRate(category),
          extraKmMultiplier: getCategoryExtraKmMultiplier(category),
        },
      },
    ];
  });
}

export async function processCheckout(input: {
  category: VehicleCategory;
  officeSlug: string;
  startDate: Date;
  endDate: Date;
  plannedKm: number;
  extras: Array<{ key: ExtraType; quantity: number }>;
  client: { firstName: string; lastName: string; email: string; phone: string };
  notes?: string;
}) {
  const { category, officeSlug, startDate, endDate, plannedKm, extras, client, notes } = input;

  const totalDays = getTotalDays(startDate, endDate);
  if (totalDays < 1) throw new Error('INVALID_DATE_RANGE');
  if (totalDays > MAX_RENTAL_DAYS) throw new Error('MAX_RENTAL_DAYS_EXCEEDED');

  const baseRateTotal = getCategoryTariff(category, totalDays);
  if (baseRateTotal === null) throw new Error('MAX_RENTAL_DAYS_EXCEEDED');

  const includedKm = getIncludedKm(totalDays);
  const extraKm = Math.max(0, plannedKm - includedKm);
  const extraKmRate = getExtraKmRate(category);
  const extraKmSurcharge = roundCurrency(extraKm * extraKmRate);

  const extrasByType = extras.reduce((acc, extra) => {
    acc[extra.key] = (acc[extra.key] ?? 0) + extra.quantity;
    return acc;
  }, {} as Partial<Record<ExtraType, number>>);

  const txResult = await prisma.$transaction(
    async (tx) => {
      // 1. Resolve office
      const office = await tx.office.findUnique({ where: { slug: officeSlug } });
      if (!office) throw new Error('OFFICE_NOT_FOUND');

      // 2. Assign a concrete available unit internally for the selected category.
      const vehicle = await tx.vehicle.findFirst({
        where: {
          isActive: true,
          officeId: office.id,
          category,
          NOT: {
            reservations: {
              some: {
                status: { not: 'CANCELLED' },
                startDate: { lt: endDate },
                endDate: { gt: startDate },
              },
            },
          },
        },
        orderBy: { dailyRate: 'asc' },
      });
      if (!vehicle) throw new Error('CATEGORY_NOT_AVAILABLE');

      const maxBabySeats = Math.max(vehicle.seats - 1, 0);
      if ((extrasByType.BABY_SEAT ?? 0) > maxBabySeats) {
        throw new Error('INVALID_BABY_SEAT_QUANTITY');
      }

      // 3. Upsert client (same email = returning customer)
      const dbClient = await tx.client.upsert({
        where: { email: client.email },
        update: {
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
        },
        create: { ...client },
      });

      // 4. Compute pricing
      const dailyRate = roundCurrency(baseRateTotal / totalDays);
      const extrasData = (Object.keys(extrasByType) as ExtraType[]).map((type) => {
        const quantity = extrasByType[type] ?? 0;
        const pricePerDay = EXTRAS_PRICING[type];
        return {
          type,
          quantity,
          pricePerDay,
          totalPrice: roundCurrency(pricePerDay * quantity * totalDays),
        };
      });
      const extrasTotal = roundCurrency(extrasData.reduce((sum, e) => sum + e.totalPrice, 0));
      const totalAmount = roundCurrency(baseRateTotal + extrasTotal + extraKmSurcharge);

      const internalNotes = [
        `[renting-meta] category=${category}; plannedKm=${plannedKm}; includedKm=${includedKm}; extraKm=${extraKm}; extraKmRate=${extraKmRate.toFixed(2)}; extraKmSurcharge=${extraKmSurcharge.toFixed(2)}`,
      ];
      const reservationNotes = [notes?.trim(), ...internalNotes]
        .filter((line): line is string => Boolean(line && line.length > 0))
        .join('\n');

      // 5. Create reservation + extras atomically
      const reservation = await tx.reservation.create({
        data: {
          confirmationCode: generateConfirmationCode(),
          vehicleId: vehicle.id,
          clientId: dbClient.id,
          officeId: office.id,
          startDate,
          endDate,
          totalDays,
          dailyRate,
          extrasTotal,
          totalAmount,
          notes: reservationNotes || undefined,
          extras: { create: extrasData },
        },
        include: { extras: true },
      });

      const result = {
        reservationId: reservation.id,
        confirmationCode: reservation.confirmationCode,
        totalAmount: Number(reservation.totalAmount),
        pricing: {
          totalDays,
          baseRateTotal,
          includedKm,
          plannedKm,
          extraKm,
          extraKmRate,
          extraKmSurcharge,
          extrasTotal,
          totalAmount: Number(reservation.totalAmount),
        },
      };

      return result;
    },
    { isolationLevel: 'Serializable' },
  );

  sendBookingEmails({
    confirmationCode: txResult.confirmationCode,
    totalAmount: txResult.totalAmount,
    client: {
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
    },
    category,
    officeSlug,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    extras: extras.map((e) => ({ key: e.key as string, quantity: e.quantity })),
  });

  return txResult;
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
