import { Prisma, type VehicleCategory } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { generateConfirmationCode } from '../../utils/confirmationCode';
import {
  billableRentalDays,
  calendarDaysBetween,
  isoDateOnly,
  madridDateTimeToUtc,
  nominalRentalMinutes,
} from '../../utils/datetime';
import { sendBookingEmails, type SendEmailResult } from '../../utils/mailer';
import {
  QuoteError,
  RENTAL_RULES,
  TARIFFS,
  buildQuote,
  getTariff,
  roundCurrency,
  type Quote,
  type SuperCategory,
} from '../../config/catalog';
import type { CheckoutBody } from './reservations.schema';

/** Las gamas del catálogo público se agrupan en las categorías de la flota. */
const CATEGORY_BY_SUPER_CATEGORY: Record<SuperCategory, VehicleCategory> = {
  Coches: 'TURISMOS',
  Furgonetas: 'FURGONETAS',
  Todoterrenos: 'SUV_4X4',
  Autocaravanas: 'AUTOCARAVANAS',
};

export class ReservationError extends Error {}

/**
 * Reintenta una transacción Serializable cuando Postgres aborta por conflicto
 * de serialización (Prisma P2034). Sin esto, dos checkouts simultáneos sobre
 * la misma sede/categoría — o un doble clic en «Enviar» — devuelven un 500.
 */
async function withSerializableRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run();
    } catch (err) {
      lastError = err;
      const isSerializationConflict =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
      if (!isSerializationConflict || attempt === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
    }
  }

  throw lastError;
}

/**
 * Unidades activas de una categoría sin reserva solapada en el rango.
 *
 * El solape se evalúa por día civil con intervalo CERRADO (lte/gte): una
 * unidad que se devuelve el día 12 no se ofrece para una recogida ese mismo
 * día 12, aunque las horas no choquen. Es deliberadamente conservador: entre
 * dos alquileres hace falta revisar y limpiar el vehículo, y el equipo puede
 * asignar a mano desde el panel si quiere apurar el mismo día.
 */
function availabilityFilter(
  officeId: string,
  category: VehicleCategory,
  startDate: Date,
  endDate: Date,
): Prisma.VehicleWhereInput {
  return {
    isActive: true,
    officeId,
    category,
    NOT: {
      reservations: {
        some: {
          status: { not: 'CANCELLED' },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      },
    },
  };
}

export interface TariffOffer {
  tariffId: string;
  name: string;
  superCategory: SuperCategory;
  availableUnits: number;
  quote: Quote;
}

/**
 * Gamas disponibles en una sede para un rango, con su presupuesto orientativo
 * al kilometraje incluido. Alimenta el paso «tipo de vehículo» del wizard.
 */
export async function getAvailableTariffOffers(params: {
  officeSlug: string;
  startDate: string;
  endDate: string;
}): Promise<TariffOffer[]> {
  const totalDays = calendarDaysBetween(params.startDate, params.endDate);
  if (totalDays < 1) throw new ReservationError('INVALID_DATE_RANGE');
  if (totalDays > RENTAL_RULES.maxRentalDays) throw new ReservationError('MAX_RENTAL_DAYS_EXCEEDED');

  const office = await prisma.office.findUnique({ where: { slug: params.officeSlug } });
  if (!office) throw new ReservationError('OFFICE_NOT_FOUND');

  const start = isoDateOnly(params.startDate);
  const end = isoDateOnly(params.endDate);

  const grouped = await prisma.vehicle.groupBy({
    by: ['category'],
    where: {
      isActive: true,
      officeId: office.id,
      NOT: {
        reservations: {
          some: {
            status: { not: 'CANCELLED' },
            startDate: { lte: end },
            endDate: { gte: start },
          },
        },
      },
    },
    _count: { _all: true },
  });

  const unitsByCategory = new Map<VehicleCategory, number>(
    grouped.map((row) => [row.category, row._count._all]),
  );

  return TARIFFS.map((tariff) => ({
    tariffId: tariff.id,
    name: tariff.name,
    superCategory: tariff.superCategory,
    availableUnits: unitsByCategory.get(CATEGORY_BY_SUPER_CATEGORY[tariff.superCategory]) ?? 0,
    quote: buildQuote({
      tariffId: tariff.id,
      totalDays,
      plannedKm: tariff.kmPerDay * totalDays,
      extras: [],
    }),
  }));
}

export interface BookingRequestResult {
  reservationId: string;
  confirmationCode: string;
  quote: Quote;
  needsAvailabilityCheck: boolean;
  pickupAt: Date;
  returnAt: Date;
  email: { admin: SendEmailResult; customer: SendEmailResult };
}

/**
 * Registra una solicitud de reserva llegada por la web y avisa por email.
 *
 * Decisiones importantes:
 *   · El presupuesto se recalcula aquí desde el catálogo. Nunca se aceptan
 *     importes enviados por el navegador.
 *   · Si no hay unidad libre de esa gama, la solicitud NO se rechaza: se guarda
 *     sin vehículo asignado y marcada `needsAvailabilityCheck`. Perder un
 *     cliente por un hueco de agenda sería peor que revisarlo a mano.
 *   · Los emails se envían fuera de la transacción y su resultado se devuelve,
 *     para que el frontend pueda avisar si el aviso no salió.
 */
export async function createBookingRequest(input: CheckoutBody): Promise<BookingRequestResult> {
  // Duración nominal («de sábado 10:00 a domingo 10:00 son 24 h», con o sin
  // cambio de hora de por medio). El mínimo publicado es de 24 horas.
  const nominalMinutes = nominalRentalMinutes(
    input.pickupDate,
    input.pickupTime,
    input.returnDate,
    input.returnTime,
  );
  if (nominalMinutes <= 0) throw new ReservationError('INVALID_DATE_RANGE');
  if (nominalMinutes < RENTAL_RULES.minRentalHours * 60) {
    throw new ReservationError('MIN_RENTAL_DURATION');
  }

  // Días facturables según las condiciones publicadas: periodos de 24 h con
  // 1 h de cortesía en la devolución. 32 h → 2 días; 24 h 45 min → 1 día.
  const totalDays = billableRentalDays(nominalMinutes, RENTAL_RULES.returnGraceMinutes);
  if (totalDays < 1) throw new ReservationError('INVALID_DATE_RANGE');
  if (totalDays > RENTAL_RULES.maxRentalDays) throw new ReservationError('MAX_RENTAL_DAYS_EXCEEDED');

  const tariff = getTariff(input.tariffId);
  if (!tariff) throw new ReservationError('TARIFF_NOT_FOUND');

  // El recargo por devolver en otra oficina lo impone el SERVIDOR: no se
  // confía en que el navegador haya añadido el extra correspondiente.
  const isDifferentOfficeReturn = input.returnOfficeSlug !== input.pickupOfficeSlug;
  const extras = input.extras.filter((extra) => extra.id !== 'differentOfficeReturn');
  if (isDifferentOfficeReturn) {
    extras.push({ id: 'differentOfficeReturn', quantity: 1 });
  }

  let quote: Quote;
  try {
    quote = buildQuote({
      tariffId: input.tariffId,
      totalDays,
      plannedKm: input.plannedKm,
      extras,
    });
  } catch (err) {
    throw err instanceof QuoteError ? new ReservationError(err.message) : err;
  }

  const pickupAt = madridDateTimeToUtc(input.pickupDate, input.pickupTime);
  const returnAt = madridDateTimeToUtc(input.returnDate, input.returnTime);

  const startDate = isoDateOnly(input.pickupDate);
  const endDate = isoDateOnly(input.returnDate);
  const category = CATEGORY_BY_SUPER_CATEGORY[tariff.superCategory];

  const created = await withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
      const pickupOffice = await tx.office.findUnique({ where: { slug: input.pickupOfficeSlug } });
      if (!pickupOffice) throw new ReservationError('OFFICE_NOT_FOUND');

      const returnOffice =
        input.returnOfficeSlug === input.pickupOfficeSlug
          ? pickupOffice
          : await tx.office.findUnique({ where: { slug: input.returnOfficeSlug } });
      if (!returnOffice) throw new ReservationError('RETURN_OFFICE_NOT_FOUND');

      // Asignación blanda: si hay unidad libre se reserva; si no, se marca para
      // revisión manual.
      const vehicle = await tx.vehicle.findFirst({
        where: availabilityFilter(pickupOffice.id, category, startDate, endDate),
        orderBy: { dailyRate: 'asc' },
        select: { id: true },
      });

      // En un cliente existente solo se refresca el teléfono: el endpoint es
      // público y cualquiera que conozca un email podría, si no, reescribir la
      // identidad (nombre y apellidos) del cliente real en todo su histórico.
      const client = await tx.client.upsert({
        where: { email: input.client.email },
        update: {
          phone: input.client.phone,
        },
        create: {
          firstName: input.client.firstName,
          lastName: input.client.lastName,
          email: input.client.email,
          phone: input.client.phone,
        },
      });

      const reservation = await tx.reservation.create({
        data: {
          confirmationCode: generateConfirmationCode(),
          vehicleId: vehicle?.id ?? null,
          clientId: client.id,
          officeId: pickupOffice.id,
          returnOfficeId: returnOffice.id,
          pickupAt,
          returnAt,
          startDate,
          endDate,
          totalDays,
          tariffId: tariff.id,
          tariffName: tariff.name,
          plannedKm: quote.plannedKm,
          includedKm: quote.includedKm,
          extraKm: quote.extraKm,
          extraKmRate: quote.extraKmRate,
          extraKmSurcharge: quote.extraKmSurcharge,
          baseTotal: quote.baseTotal,
          dailyRate: quote.baseTotal === null ? 0 : roundCurrency(quote.baseTotal / totalDays),
          extrasTotal: quote.extrasTotal,
          totalAmount: quote.totalAmount,
          deposit: quote.deposit,
          franchise: quote.franchise,
          needsAvailabilityCheck: !vehicle,
          notes: input.notes?.trim() || null,
          consentAt: new Date(),
          extras: {
            create: quote.extras.map((extra) => ({
              type: extra.id,
              label: extra.label,
              unit: extra.unit,
              quantity: extra.quantity,
              unitPrice: extra.unitPrice,
              totalPrice: extra.totalPrice,
            })),
          },
        },
        select: { id: true, confirmationCode: true },
      });

      return {
        reservationId: reservation.id,
        confirmationCode: reservation.confirmationCode,
        needsAvailabilityCheck: !vehicle,
        pickupOffice: { city: pickupOffice.city, address: pickupOffice.address },
        returnOffice: { city: returnOffice.city, address: returnOffice.address },
      };
      },
      { isolationLevel: 'Serializable' },
    ),
  );

  const email = await sendBookingEmails({
    confirmationCode: created.confirmationCode,
    reservationId: created.reservationId,
    client: input.client,
    quote,
    pickupOffice: created.pickupOffice,
    returnOffice: created.returnOffice,
    pickupAt,
    returnAt,
    notes: input.notes,
    needsAvailabilityCheck: created.needsAvailabilityCheck,
  });

  return {
    reservationId: created.reservationId,
    confirmationCode: created.confirmationCode,
    quote,
    needsAvailabilityCheck: created.needsAvailabilityCheck,
    pickupAt,
    returnAt,
    email,
  };
}


/** Consulta pública por código de confirmación, para el «¿y mi reserva?». */
export async function getReservationByCode(confirmationCode: string) {
  return prisma.reservation.findUnique({
    where: { confirmationCode },
    select: {
      confirmationCode: true,
      status: true,
      pickupAt: true,
      returnAt: true,
      totalDays: true,
      tariffName: true,
      totalAmount: true,
      createdAt: true,
      office: { select: { city: true, address: true, phone: true } },
      returnOffice: { select: { city: true } },
      extras: { select: { label: true, quantity: true, totalPrice: true } },
    },
  });
}
