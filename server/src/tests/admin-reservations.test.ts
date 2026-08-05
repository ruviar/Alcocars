import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../db/prisma';
import {
  AdminReservationError,
  getAllReservations,
  updateReservation,
  updateReservationStatus,
} from '../modules/admin/reservations/admin-reservations.service';

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

describe('updateReservationStatus', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  function mockCurrent(status: string, vehicleId: string | null = 'v1') {
    vi.spyOn(prisma.reservation, 'findUnique').mockResolvedValue({ status, vehicleId } as never);
    return vi.spyOn(prisma.reservation, 'update').mockResolvedValue({ id: 'r1' } as never);
  }

  it('permite PENDING → CONFIRMED con vehículo asignado', async () => {
    const update = mockCurrent('PENDING', 'v1');
    await updateReservationStatus('r1', 'CONFIRMED');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CONFIRMED' } }),
    );
  });

  it('bloquea confirmar sin vehículo asignado', async () => {
    mockCurrent('PENDING', null);
    await expect(updateReservationStatus('r1', 'CONFIRMED')).rejects.toThrow('NO_VEHICLE_ASSIGNED');
  });

  it('bloquea transiciones sin sentido (COMPLETED → PENDING)', async () => {
    mockCurrent('COMPLETED');
    await expect(updateReservationStatus('r1', 'PENDING')).rejects.toThrow(
      'INVALID_STATUS_TRANSITION',
    );
  });

  it('bloquea saltarse el flujo (PENDING → ACTIVE)', async () => {
    mockCurrent('PENDING');
    await expect(updateReservationStatus('r1', 'ACTIVE')).rejects.toThrow(
      'INVALID_STATUS_TRANSITION',
    );
  });

  it('permite reabrir una cancelada', async () => {
    const update = mockCurrent('CANCELLED');
    await updateReservationStatus('r1', 'PENDING');
    expect(update).toHaveBeenCalled();
  });

  it('404 cuando la reserva no existe', async () => {
    vi.spyOn(prisma.reservation, 'findUnique').mockResolvedValue(null);
    await expect(updateReservationStatus('nope', 'CONFIRMED')).rejects.toThrow(
      AdminReservationError,
    );
  });
});

describe('updateReservation (asignación de unidad)', () => {
  const tx = {
    reservation: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    vehicle: { findUnique: vi.fn() },
  };

  const baseReservation = {
    officeId: 'office1',
    startDate: new Date('2026-08-12'),
    endDate: new Date('2026-08-15'),
    tariffId: 'coche-media',
    status: 'PENDING',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(tx));
    tx.reservation.findUnique.mockResolvedValue(baseReservation);
    tx.reservation.findFirst.mockResolvedValue(null);
    tx.reservation.update.mockResolvedValue({ id: 'r1' });
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('asigna una unidad válida y limpia needsAvailabilityCheck', async () => {
    tx.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      isActive: true,
      officeId: 'office1',
      category: 'TURISMOS',
    });

    await updateReservation('r1', { vehicleId: 'v1' });

    expect(tx.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          vehicle: { connect: { id: 'v1' } },
          needsAvailabilityCheck: false,
        }),
      }),
    );
  });

  it('rechaza una unidad de otra sede', async () => {
    tx.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      isActive: true,
      officeId: 'office2',
      category: 'TURISMOS',
    });

    await expect(updateReservation('r1', { vehicleId: 'v1' })).rejects.toThrow(
      'VEHICLE_WRONG_OFFICE',
    );
  });

  it('rechaza una unidad de otra categoría que la gama', async () => {
    tx.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      isActive: true,
      officeId: 'office1',
      category: 'FURGONETAS',
    });

    await expect(updateReservation('r1', { vehicleId: 'v1' })).rejects.toThrow(
      'VEHICLE_WRONG_CATEGORY',
    );
  });

  it('rechaza una unidad con reserva solapada', async () => {
    tx.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      isActive: true,
      officeId: 'office1',
      category: 'TURISMOS',
    });
    tx.reservation.findFirst.mockResolvedValue({ confirmationCode: 'ALC-OTRA' });

    await expect(updateReservation('r1', { vehicleId: 'v1' })).rejects.toThrow(
      'VEHICLE_ALREADY_BOOKED',
    );
  });

  it('desasignar marca la reserva para revisar disponibilidad', async () => {
    await updateReservation('r1', { vehicleId: null });

    expect(tx.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          vehicle: { disconnect: true },
          needsAvailabilityCheck: true,
        }),
      }),
    );
  });

  it('actualiza las notas sin tocar el vehículo', async () => {
    await updateReservation('r1', { notes: 'Cliente llega en tren' });

    const call = tx.reservation.update.mock.calls[0][0];
    expect(call.data.notes).toBe('Cliente llega en tren');
    expect(call.data.vehicle).toBeUndefined();
  });
});
