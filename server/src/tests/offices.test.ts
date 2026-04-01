import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../db/prisma';
import { getAllOffices } from '../modules/offices/offices.service';

describe('getAllOffices', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns all offices ordered by city', async () => {
    const mockOffices = [
      { id: '1', slug: 'soria', city: 'Soria' },
      { id: '2', slug: 'zaragoza', city: 'Zaragoza' },
    ];
    vi.spyOn(prisma.office, 'findMany').mockResolvedValue(mockOffices as any);

    const result = await getAllOffices();

    expect(prisma.office.findMany).toHaveBeenCalledWith({ orderBy: { city: 'asc' } });
    expect(result).toHaveLength(2);
  });
});
