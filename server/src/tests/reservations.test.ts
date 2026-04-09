import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../db/prisma';
import { processCheckout } from '../modules/reservations/reservations.service';

// Shared transaction mock object — set return values per test
const tx = {
  vehicle: { findFirst: vi.fn() },
  reservation: { create: vi.fn() },
  office: { findUnique: vi.fn() },
  client: { upsert: vi.fn() },
};

const validInput = {
  category: 'TURISMOS' as const,
  officeSlug: 'zaragoza',
  startDate: new Date('2026-05-01'),
  endDate: new Date('2026-05-05'),
  plannedKm: 800,
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

  it('throws CATEGORY_NOT_AVAILABLE when no unit is available in selected category', async () => {
    tx.office.findUnique.mockResolvedValue({ id: 'office1' });
    tx.vehicle.findFirst.mockResolvedValue(null);

    await expect(processCheckout(validInput)).rejects.toThrow('CATEGORY_NOT_AVAILABLE');
  });

  it('creates reservation and returns confirmation with category pricing and extra km surcharge', async () => {
    tx.office.findUnique.mockResolvedValue({ id: 'office1' });
    tx.vehicle.findFirst.mockResolvedValue({ id: 'v1', seats: 5 });
    tx.client.upsert.mockResolvedValue({ id: 'client1' });
    tx.reservation.create.mockResolvedValue({
      id: 'res1',
      confirmationCode: 'ALC-TESTCODE',
      totalAmount: '216.00',
      extras: [],
    });

    const result = await processCheckout({ ...validInput, plannedKm: 1000 });

    expect(result.confirmationCode).toBe('ALC-TESTCODE');
    expect(result.reservationId).toBe('res1');
    expect(result.pricing.baseRateTotal).toBe(180);
    expect(result.pricing.includedKm).toBe(800);
    expect(result.pricing.extraKm).toBe(200);
    expect(result.pricing.extraKmSurcharge).toBe(36);
    expect(tx.reservation.create).toHaveBeenCalledOnce();
  });

  it('multiplies extra total by quantity and rental days', async () => {
    tx.office.findUnique.mockResolvedValue({ id: 'office1' });
    tx.vehicle.findFirst.mockResolvedValue({ id: 'v1', seats: 5 });
    tx.client.upsert.mockResolvedValue({ id: 'client1' });
    tx.reservation.create.mockResolvedValue({
      id: 'res1',
      confirmationCode: 'ALC-TESTCODE',
      totalAmount: '244.00',
      extras: [],
    });

    await processCheckout({
      ...validInput,
      plannedKm: 700,
      extras: [{ key: 'BABY_SEAT', quantity: 2 }],
    });

    const createArgs = tx.reservation.create.mock.calls[0][0];
    expect(createArgs.data.extrasTotal).toBe(64);
    expect(createArgs.data.totalAmount).toBe(244);
    expect(createArgs.data.extras.create).toEqual([
      {
        type: 'BABY_SEAT',
        quantity: 2,
        pricePerDay: 8,
        totalPrice: 64,
      },
    ]);
  });

  it('throws INVALID_BABY_SEAT_QUANTITY when quantity exceeds available seats', async () => {
    tx.office.findUnique.mockResolvedValue({ id: 'office1' });
    tx.vehicle.findFirst.mockResolvedValue({ id: 'v1', seats: 4 });

    await expect(
      processCheckout({
        ...validInput,
        extras: [{ key: 'BABY_SEAT', quantity: 4 }],
      }),
    ).rejects.toThrow('INVALID_BABY_SEAT_QUANTITY');
  });

  it('throws INVALID_DATE_RANGE when endDate is before startDate', async () => {
    await expect(
      processCheckout({ ...validInput, startDate: new Date('2026-05-10'), endDate: new Date('2026-05-01') }),
    ).rejects.toThrow('INVALID_DATE_RANGE');
  });

  it('throws MAX_RENTAL_DAYS_EXCEEDED when rental exceeds 7 days', async () => {
    await expect(
      processCheckout({ ...validInput, endDate: new Date('2026-05-12') }),
    ).rejects.toThrow('MAX_RENTAL_DAYS_EXCEEDED');
  });
});
