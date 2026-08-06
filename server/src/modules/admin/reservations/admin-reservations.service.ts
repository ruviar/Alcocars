import type { Prisma, ReservationStatus, VehicleCategory } from '@prisma/client';
import { prisma } from '../../../db/prisma';
import { getTariff, type SuperCategory } from '../../../config/catalog';
import { isoDateOnly } from '../../../utils/datetime';
import type { ListReservationsQuery, UpdateReservationBody } from './admin-reservations.schema';

export class AdminReservationError extends Error {}

/**
 * Transiciones de estado permitidas. Cualquier otra devuelve 422 con el motivo,
 * para que el panel no pueda dejar una reserva en un estado sin sentido.
 */
const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACTIVE', 'PENDING', 'CANCELLED'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: ['PENDING'],
};

const CATEGORY_BY_SUPER_CATEGORY: Record<SuperCategory, VehicleCategory> = {
  Coches: 'TURISMOS',
  Furgonetas: 'FURGONETAS',
  Todoterrenos: 'SUV_4X4',
  Autocaravanas: 'AUTOCARAVANAS',
};

const LIST_INCLUDE = {
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  vehicle: { select: { id: true, brand: true, name: true, category: true } },
  office: { select: { slug: true, city: true } },
  returnOffice: { select: { slug: true, city: true } },
} satisfies Prisma.ReservationInclude;

export async function listReservations(query: ListReservationsQuery) {
  const where: Prisma.ReservationWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.needsCheck !== undefined) where.needsAvailabilityCheck = query.needsCheck;
  if (query.from) where.startDate = { gte: isoDateOnly(query.from) };
  if (query.to) {
    where.endDate = { lte: isoDateOnly(query.to) };
  }

  if (query.search) {
    const term = query.search;
    where.OR = [
      { confirmationCode: { contains: term, mode: 'insensitive' } },
      { client: { firstName: { contains: term, mode: 'insensitive' } } },
      { client: { lastName: { contains: term, mode: 'insensitive' } } },
      { client: { email: { contains: term, mode: 'insensitive' } } },
      { client: { phone: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, page: query.page, pageSize: query.pageSize, rows };
}

export async function getReservationDetail(id: string) {
  return prisma.reservation.findUnique({
    where: { id },
    include: {
      ...LIST_INCLUDE,
      office: { select: { slug: true, city: true, address: true, phone: true } },
      returnOffice: { select: { slug: true, city: true, address: true, phone: true } },
      extras: true,
      emails: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function updateReservationStatus(id: string, nextStatus: ReservationStatus) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: { status: true, vehicleId: true },
  });
  if (!reservation) throw new AdminReservationError('RESERVATION_NOT_FOUND');

  if (reservation.status === nextStatus) {
    return prisma.reservation.findUnique({ where: { id }, include: LIST_INCLUDE });
  }

  if (!ALLOWED_TRANSITIONS[reservation.status].includes(nextStatus)) {
    throw new AdminReservationError('INVALID_STATUS_TRANSITION');
  }

  // No se confirma una reserva sin unidad asignada: primero hay que asignarla.
  if ((nextStatus === 'CONFIRMED' || nextStatus === 'ACTIVE') && !reservation.vehicleId) {
    throw new AdminReservationError('NO_VEHICLE_ASSIGNED');
  }

  // Al reabrir una cancelada, la unidad que tenía puede haberse asignado a
  // otra reserva mientras tanto (los solapes ignoran CANCELLED a propósito).
  // Se desasigna y se marca para revisar disponibilidad: el panel obliga a
  // asignar de nuevo antes de poder confirmar.
  const reopeningCancelled = reservation.status === 'CANCELLED' && nextStatus === 'PENDING';

  return prisma.reservation.update({
    where: { id },
    data: reopeningCancelled
      ? { status: nextStatus, vehicleId: null, needsAvailabilityCheck: true }
      : { status: nextStatus },
    include: LIST_INCLUDE,
  });
}

/** Categoría de flota que corresponde a la gama de la reserva (null = cualquiera). */
function categoryForReservation(tariffId: string): VehicleCategory | null {
  const tariff = getTariff(tariffId);
  if (!tariff) return null; // reservas antiguas sin gama del catálogo
  return CATEGORY_BY_SUPER_CATEGORY[tariff.superCategory];
}

/**
 * Unidades asignables a una reserva: activas, de la sede de recogida, de la
 * categoría de su gama y sin solape con otra reserva no cancelada.
 */
export async function listAssignableVehicles(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { officeId: true, startDate: true, endDate: true, tariffId: true, vehicleId: true },
  });
  if (!reservation) throw new AdminReservationError('RESERVATION_NOT_FOUND');

  const category = categoryForReservation(reservation.tariffId);

  return prisma.vehicle.findMany({
    where: {
      isActive: true,
      officeId: reservation.officeId,
      ...(category ? { category } : {}),
      NOT: {
        reservations: {
          some: {
            id: { not: reservationId },
            status: { not: 'CANCELLED' },
            // Intervalo cerrado: mismo criterio conservador que el checkout
            // público (sin rotación de la misma unidad el mismo día civil).
            startDate: { lte: reservation.endDate },
            endDate: { gte: reservation.startDate },
          },
        },
      },
    },
    select: {
      id: true,
      brand: true,
      name: true,
      category: true,
      seats: true,
      transmission: true,
      fuel: true,
    },
    orderBy: [{ brand: 'asc' }, { name: 'asc' }],
  });
}

export async function updateReservation(id: string, body: UpdateReservationBody) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id },
      select: { officeId: true, startDate: true, endDate: true, tariffId: true, status: true },
    });
    if (!reservation) throw new AdminReservationError('RESERVATION_NOT_FOUND');

    const data: Prisma.ReservationUpdateInput = {};

    if (body.notes !== undefined) {
      data.notes = body.notes;
    }

    if (body.vehicleId !== undefined) {
      if (body.vehicleId === null) {
        // Una reserva confirmada o en curso no puede quedarse sin unidad en
        // silencio: primero hay que devolverla a pendiente (o reasignar
        // directamente otra unidad, que sí está permitido).
        if (reservation.status === 'CONFIRMED' || reservation.status === 'ACTIVE') {
          throw new AdminReservationError('VEHICLE_REQUIRED_FOR_STATUS');
        }

        // Desasignar deja la reserva pendiente de revisión de disponibilidad.
        data.vehicle = { disconnect: true };
        data.needsAvailabilityCheck = true;
      } else {
        const vehicle = await tx.vehicle.findUnique({
          where: { id: body.vehicleId },
          select: { id: true, isActive: true, officeId: true, category: true },
        });
        if (!vehicle || !vehicle.isActive) throw new AdminReservationError('VEHICLE_NOT_FOUND');
        if (vehicle.officeId !== reservation.officeId) {
          throw new AdminReservationError('VEHICLE_WRONG_OFFICE');
        }

        const expectedCategory = categoryForReservation(reservation.tariffId);
        if (expectedCategory && vehicle.category !== expectedCategory) {
          throw new AdminReservationError('VEHICLE_WRONG_CATEGORY');
        }

        const conflict = await tx.reservation.findFirst({
          where: {
            id: { not: id },
            vehicleId: vehicle.id,
            status: { not: 'CANCELLED' },
            startDate: { lte: reservation.endDate },
            endDate: { gte: reservation.startDate },
          },
          select: { confirmationCode: true },
        });
        if (conflict) throw new AdminReservationError('VEHICLE_ALREADY_BOOKED');

        data.vehicle = { connect: { id: vehicle.id } };
        data.needsAvailabilityCheck = false;
      }
    }

    return tx.reservation.update({ where: { id }, data, include: LIST_INCLUDE });
  });
}

/** Compatibilidad con el endpoint original del backoffice. */
export async function getAllReservations() {
  return prisma.reservation.findMany({
    include: {
      client: { select: { firstName: true, lastName: true, email: true, phone: true } },
      vehicle: { select: { brand: true, name: true } },
      office: { select: { city: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
