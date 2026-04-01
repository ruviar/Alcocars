import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../db/prisma';
import { processCheckout } from '../modules/reservations/reservations.service';

// Shared transaction mock object — set return values per test
const tx = {
  vehicle: { findFirst: vi.fn() },
  reservation: { findFirst: vi.fn(), create: vi.fn() },
  office: { findUnique: vi.fn() },
  client: { upsert: vi.fn() },
};

const validInput = {
  vehicleId: 'v1',
  officeSlug: 'zaragoza',
  startDate: new Date('2026-05-01'),
  endDate: new Date('2026-05-05'),
  extras: [] as any[],
  client: { firstName: 'Ana', lastName: 'García', email: 'ana@test.es', phone: '+34600000001' },
};

describe('processCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on $transaction on the real prisma singleton — passes tx to the callback
    vi.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(tx));
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('throws VEHICLE_NOT_FOUND when vehicle does not exist', async () => {
    tx.vehicle.findFirst.mockResolvedValue(null);
    await expect(processCheckout(validInput)).rejects.toThrow('VEHICLE_NOT_FOUND');
  });

  it('throws VEHICLE_NOT_AVAILABLE when overlap reservation exists', async () => {
    tx.vehicle.findFirst.mockResolvedValue({ id: 'v1', dailyRate: 89 });
    tx.reservation.findFirst.mockResolvedValue({ id: 'conflict' });
    await expect(processCheckout(validInput)).rejects.toThrow('VEHICLE_NOT_AVAILABLE');
  });

  it('creates reservation and returns confirmation when available', async () => {
    tx.vehicle.findFirst.mockResolvedValue({ id: 'v1', dailyRate: '89' });
    tx.reservation.findFirst.mockResolvedValue(null);
    tx.office.findUnique.mockResolvedValue({ id: 'office1' });
    tx.client.upsert.mockResolvedValue({ id: 'client1' });
    tx.reservation.create.mockResolvedValue({
      id: 'res1',
      confirmationCode: 'ALC-TESTCODE',
      totalAmount: '356.00',
      extras: [],
    });

    const result = await processCheckout(validInput);

    expect(result.confirmationCode).toBe('ALC-TESTCODE');
    expect(result.reservationId).toBe('res1');
    expect(tx.reservation.create).toHaveBeenCalledOnce();
  });

  it('throws INVALID_DATE_RANGE when endDate is before startDate', async () => {
    await expect(
      processCheckout({ ...validInput, startDate: new Date('2026-05-10'), endDate: new Date('2026-05-01') }),
    ).rejects.toThrow('INVALID_DATE_RANGE');
  });
});
