import { prisma } from '../../../db/prisma';

/**
 * Métricas del panel: recuentos por estado, solicitudes por revisar, próximas
 * recogidas, entradas recientes y salud del correo. Todo en unas pocas
 * consultas agregadas.
 */
export async function getAdminStats() {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const in7days = new Date(startOfToday.getTime() + 7 * 86_400_000);
  const last30days = new Date(now.getTime() - 30 * 86_400_000);
  const last7days = new Date(now.getTime() - 7 * 86_400_000);

  const [
    byStatus,
    needsCheck,
    upcomingPickups,
    requestsLast30d,
    emailFailures7d,
    revenueAgg,
    nextPickups,
  ] = await Promise.all([
    prisma.reservation.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.reservation.count({
      where: { needsAvailabilityCheck: true, status: 'PENDING' },
    }),
    prisma.reservation.count({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        startDate: { gte: startOfToday, lt: in7days },
      },
    }),
    prisma.reservation.count({ where: { createdAt: { gte: last30days } } }),
    prisma.emailLog.count({ where: { status: 'FAILED', createdAt: { gte: last7days } } }),
    prisma.reservation.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
        createdAt: { gte: last30days },
      },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        startDate: { gte: startOfToday },
      },
      orderBy: { pickupAt: 'asc' },
      take: 5,
      select: {
        id: true,
        confirmationCode: true,
        pickupAt: true,
        tariffName: true,
        status: true,
        needsAvailabilityCheck: true,
        client: { select: { firstName: true, lastName: true } },
        office: { select: { city: true } },
      },
    }),
  ]);

  const totals: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    ACTIVE: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const row of byStatus) {
    totals[row.status] = row._count._all;
  }

  return {
    totals,
    needsCheck,
    upcomingPickups7d: upcomingPickups,
    requestsLast30d,
    emailFailures7d,
    confirmedRevenue30d: Number(revenueAgg._sum.totalAmount ?? 0),
    nextPickups,
  };
}
