import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../db/prisma';
import { getAllReservations } from '../modules/admin/reservations/admin-reservations.service';

describe('getAllReservations', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('queries with client, vehicle, office includes ordered by createdAt desc', async () => {
    vi.spyOn(prisma.reservation, 'findMany').mockResolvedValue([]);

    await getAllReservations();

    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          client: expect.any(Object),
          vehicle: expect.any(Object),
          office: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      }),
    );
  });
});
