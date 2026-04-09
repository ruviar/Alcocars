import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../db/prisma';
import { processCheckout } from '../modules/reservations/reservations.service';

// Shared transaction mock object — set return values per test
const tx = {
  category: { findFirst: vi.fn() },
  reservation: { create: vi.fn() },
  office: { findUnique: vi.fn() },
  client: { upsert: vi.fn() },
};

const mockCategory = {
  id: 'cat1',
  isActive: true,
  price1Day: '89',
  price2Day: '79',
  price3Day: '69',
  price4Day: '65',
  price5Day: '60',
  price6Day: '55',
  price7Day: '50',
  extraKmRate: '0.25',
  deposit: '300',
  franchise: '500',
};

const validInput = {
  categoryId: 'cat1',
  officeSlug: 'zaragoza',
  startDate: new Date('2026-05-01'),
  endDate: new Date('2026-05-05'),
  estimatedKm: 400,
  extras: [] as Array<{ key: 'BABY_SEAT' | 'SNOW_CHAINS' | 'ADDITIONAL_DRIVER'; quantity: number }>,
  client: { firstName: 'Ana', lastName: 'García', email: 'ana@test.es', phone: '+34600000001' },
};

describe('processCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on $transaction on the real prisma singleton — passes tx to the callback
    vi.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(tx));
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('throws CATEGORY_NOT_FOUND when category does not exist', async () => {
    tx.category.findFirst.mockResolvedValue(null);
    await expect(processCheckout(validInput)).rejects.toBe('CATEGORY_NOT_FOUND');
  });

  it('creates reservation and returns confirmation when available', async () => {
    tx.category.findFirst.mockResolvedValue(mockCategory);
    tx.office.findUnique.mockResolvedValue({ id: 'office1' });
    tx.client.upsert.mockResolvedValue({ id: 'client1' });
    tx.reservation.create.mockResolvedValue({
      id: 'res1',
      confirmationCode: 'ALC-TESTCODE',
      totalAmount: '356.00',
      extras: [],
      category: { name: 'Turismo', slug: 'turismo' },
      office: { city: 'Zaragoza', address: 'Calle Test 1', phone: '976000000' },
      client: { firstName: 'Ana', lastName: 'García', email: 'ana@test.es' },
    });

    const result = await processCheckout(validInput);

    expect(result.confirmationCode).toBe('ALC-TESTCODE');
    expect(result.reservationId).toBe('res1');
    expect(tx.reservation.create).toHaveBeenCalledOnce();
  });

  it('multiplies extra total by quantity and rental days', async () => {
    tx.category.findFirst.mockResolvedValue(mockCategory);
    tx.office.findUnique.mockResolvedValue({ id: 'office1' });
    tx.client.upsert.mockResolvedValue({ id: 'client1' });
    tx.reservation.create.mockResolvedValue({
      id: 'res1',
      confirmationCode: 'ALC-TESTCODE',
      totalAmount: '420.00',
      extras: [],
      category: { name: 'Turismo', slug: 'turismo' },
      office: { city: 'Zaragoza', address: 'Calle Test 1', phone: '976000000' },
      client: { firstName: 'Ana', lastName: 'García', email: 'ana@test.es' },
    });

    await processCheckout({
      ...validInput,
      extras: [{ key: 'BABY_SEAT', quantity: 2 }],
    });

    const createArgs = tx.reservation.create.mock.calls[0][0];
    // 4 days * 2 seats * 8€/day = 64
    expect(createArgs.data.extrasTotal).toBe(64);
    expect(createArgs.data.extras.create).toEqual([
      {
        type: 'BABY_SEAT',
        quantity: 2,
        pricePerDay: 8,
        totalPrice: 64,
      },
    ]);
  });

  it('throws INVALID_DATE_RANGE when endDate is before startDate', async () => {
    await expect(
      processCheckout({ ...validInput, startDate: new Date('2026-05-10'), endDate: new Date('2026-05-01') }),
    ).rejects.toBe('INVALID_DATE_RANGE');
  });
});
