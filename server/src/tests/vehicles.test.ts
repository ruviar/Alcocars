import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../db/prisma';
import { getAvailableVehicles, getVehicleById } from '../modules/vehicles/vehicles.service';

describe('getAvailableVehicles', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('queries vehicles filtered by office, category, and date overlap exclusion', async () => {
    vi.spyOn(prisma.vehicle, 'findMany').mockResolvedValue([]);

    await getAvailableVehicles({
      officeSlug: 'zaragoza',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-05'),
      category: 'TURISMOS',
    });

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          office: { slug: 'zaragoza' },
          category: 'TURISMOS',
          NOT: {
            reservations: {
              some: expect.objectContaining({
                status: { not: 'CANCELLED' },
                startDate: { lt: new Date('2026-04-05') },
                endDate: { gt: new Date('2026-04-01') },
              }),
            },
          },
        }),
      }),
    );
  });

  it('omits category filter when not provided', async () => {
    vi.spyOn(prisma.vehicle, 'findMany').mockResolvedValue([]);

    await getAvailableVehicles({
      officeSlug: 'soria',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-05'),
    });

    const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
    expect(call.where.category).toBeUndefined();
  });
});

describe('getVehicleById', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('calls findUnique with the given id', async () => {
    vi.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(null);
    await getVehicleById('abc123');
    expect(prisma.vehicle.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'abc123' } }),
    );
  });
});
