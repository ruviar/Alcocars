import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../db/prisma';
import { getAvailableVehicles, getVehicleById } from '../modules/vehicles/vehicles.service';

describe('getAvailableVehicles', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('queries active vehicles filtered by office slug', async () => {
    vi.spyOn(prisma.vehicle, 'findMany').mockResolvedValue([]);

    await getAvailableVehicles({
      officeSlug: 'zaragoza',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-05'),
    });

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          office: { slug: 'zaragoza' },
        }),
      }),
    );
  });

  it('returns empty array when no vehicles match', async () => {
    vi.spyOn(prisma.vehicle, 'findMany').mockResolvedValue([]);

    const result = await getAvailableVehicles({
      officeSlug: 'soria',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-05'),
    });

    expect(result).toEqual([]);
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
