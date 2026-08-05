import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendBookingEmails = vi.fn();

vi.mock('../utils/mailer', () => ({
  sendBookingEmails: (...args: unknown[]) => sendBookingEmails(...args),
}));

import { prisma } from '../db/prisma';
import { checkoutBodySchema } from '../modules/reservations/reservations.schema';
import { ReservationError, createBookingRequest } from '../modules/reservations/reservations.service';

const tx = {
  office: { findUnique: vi.fn() },
  vehicle: { findFirst: vi.fn() },
  client: { upsert: vi.fn() },
  reservation: { create: vi.fn() },
};

const validBody = {
  tariffId: 'coche-media',
  pickupOfficeSlug: 'zaragoza',
  returnOfficeSlug: 'zaragoza',
  pickupDate: '2026-08-12',
  pickupTime: '10:00',
  returnDate: '2026-08-15',
  returnTime: '18:00',
  plannedKm: 900,
  extras: [{ id: 'skiRackChains', quantity: 1 }],
  client: {
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana@test.es',
    phone: '+34600000001',
  },
  notes: 'Llego en el AVE de las 9.',
  consent: true as const,
};

function parse(overrides: Record<string, unknown> = {}) {
  const parsed = checkoutBodySchema.safeParse({ ...validBody, ...overrides });
  if (!parsed.success) throw new Error(`Body inválido en el test: ${parsed.error.message}`);
  return parsed.data;
}

describe('createBookingRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(tx));

    tx.office.findUnique.mockResolvedValue({
      id: 'office-zgz',
      city: 'Zaragoza',
      address: 'Ctra. de Logroño, km 6,4',
    });
    tx.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1' });
    tx.client.upsert.mockResolvedValue({ id: 'client-1' });
    tx.reservation.create.mockResolvedValue({ id: 'res-1', confirmationCode: 'ALC-TESTCODE' });
    sendBookingEmails.mockResolvedValue({
      admin: { status: 'SENT' },
      customer: { status: 'SENT' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('guarda la solicitud con el presupuesto calculado en el servidor', async () => {
    const result = await createBookingRequest(parse());

    expect(result.confirmationCode).toBe('ALC-TESTCODE');
    // 3 días de gama media (205) + 300 km extra × 0,20 (60) + porta esquís (34,80)
    expect(result.quote.baseTotal).toBe(205);
    expect(result.quote.extraKm).toBe(300);
    expect(result.quote.extraKmSurcharge).toBe(60);
    expect(result.quote.extrasTotal).toBe(34.8);
    expect(result.quote.totalAmount).toBe(299.8);

    const data = tx.reservation.create.mock.calls[0][0].data;
    expect(data.totalAmount).toBe(299.8);
    expect(data.tariffName).toBe('Coche Gama Media');
    expect(data.totalDays).toBe(3);
    expect(data.vehicleId).toBe('vehicle-1');
    expect(data.needsAvailabilityCheck).toBe(false);
    expect(data.consentAt).toBeInstanceOf(Date);
    expect(data.extras.create).toEqual([
      {
        type: 'skiRackChains',
        label: 'Porta esquís / cadenas de nieve',
        unit: 'per_rental',
        quantity: 1,
        unitPrice: 34.8,
        totalPrice: 34.8,
      },
    ]);
  });

  it('guarda las horas de recogida y devolución en hora española', async () => {
    const result = await createBookingRequest(parse());

    // agosto → CEST (UTC+2)
    expect(result.pickupAt.toISOString()).toBe('2026-08-12T08:00:00.000Z');
    expect(result.returnAt.toISOString()).toBe('2026-08-15T16:00:00.000Z');
  });

  it('no pierde la solicitud cuando no hay unidad libre: la marca para revisión', async () => {
    tx.vehicle.findFirst.mockResolvedValue(null);

    const result = await createBookingRequest(parse());

    expect(result.needsAvailabilityCheck).toBe(true);
    const data = tx.reservation.create.mock.calls[0][0].data;
    expect(data.vehicleId).toBeNull();
    expect(data.needsAvailabilityCheck).toBe(true);
    expect(sendBookingEmails).toHaveBeenCalledOnce();
  });

  it('envía los avisos con los datos de la reserva ya creada', async () => {
    await createBookingRequest(parse());

    expect(sendBookingEmails).toHaveBeenCalledOnce();
    const payload = sendBookingEmails.mock.calls[0][0];
    expect(payload.confirmationCode).toBe('ALC-TESTCODE');
    expect(payload.reservationId).toBe('res-1');
    expect(payload.client.email).toBe('ana@test.es');
    expect(payload.quote.totalAmount).toBe(299.8);
    expect(payload.notes).toBe('Llego en el AVE de las 9.');
  });

  it('devuelve el estado del envío para poder avisar si el email falla', async () => {
    sendBookingEmails.mockResolvedValue({
      admin: { status: 'FAILED', error: 'Brevo API 401' },
      customer: { status: 'FAILED', error: 'Brevo API 401' },
    });

    const result = await createBookingRequest(parse());

    expect(result.email.admin.status).toBe('FAILED');
    // La reserva se ha guardado igualmente.
    expect(tx.reservation.create).toHaveBeenCalledOnce();
  });

  it('acepta alquileres largos: ya no hay tope de 7 días', async () => {
    const result = await createBookingRequest(parse({ returnDate: '2026-08-26', plannedKm: 2800 }));

    expect(result.quote.totalDays).toBe(14);
    // 2 semanas de gama media a 337 €
    expect(result.quote.baseTotal).toBe(674);
  });

  it('rechaza rangos por encima del máximo del formulario', async () => {
    await expect(
      createBookingRequest(parse({ returnDate: '2027-08-15', plannedKm: 5000 })),
    ).rejects.toThrow('MAX_RENTAL_DAYS_EXCEEDED');
  });

  it('rechaza una sede de recogida que no existe', async () => {
    tx.office.findUnique.mockResolvedValue(null);

    await expect(createBookingRequest(parse())).rejects.toThrow(ReservationError);
  });
});

describe('checkoutBodySchema', () => {
  it('exige el consentimiento de privacidad', () => {
    const result = checkoutBodySchema.safeParse({ ...validBody, consent: false });
    expect(result.success).toBe(false);
  });

  it('rechaza el mismo día de recogida y devolución (mínimo 24 h)', () => {
    const result = checkoutBodySchema.safeParse({ ...validBody, returnDate: validBody.pickupDate });
    expect(result.success).toBe(false);
  });

  it('rechaza una devolución anterior a la recogida', () => {
    const result = checkoutBodySchema.safeParse({ ...validBody, returnDate: '2026-08-01' });
    expect(result.success).toBe(false);
  });

  it('rechaza extras repetidos', () => {
    const result = checkoutBodySchema.safeParse({
      ...validBody,
      extras: [
        { id: 'skiRackChains', quantity: 1 },
        { id: 'skiRackChains', quantity: 1 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rechaza gamas y extras fuera del catálogo', () => {
    expect(checkoutBodySchema.safeParse({ ...validBody, tariffId: 'ferrari' }).success).toBe(false);
    expect(
      checkoutBodySchema.safeParse({ ...validBody, extras: [{ id: 'copiloto', quantity: 1 }] }).success,
    ).toBe(false);
  });

  it('rechaza horas mal formadas', () => {
    expect(checkoutBodySchema.safeParse({ ...validBody, pickupTime: '25:00' }).success).toBe(false);
  });
});
