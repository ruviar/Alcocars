import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { processCheckout } from '../modules/reservations/reservations.service';
import { reservationsRouter } from '../modules/reservations/reservations.router';

// Mock mailer to avoid real SMTP calls
vi.mock('../lib/mailer', () => ({
  sendClientConfirmation: vi.fn().mockResolvedValue(undefined),
  sendAdminNotification: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

// Coche Gama básica — 3 days = 154, extraKmRate = 0.15
const mockCategory = {
  id: 'cltest0000000000001',
  slug: 'coche-gama-basica',
  name: 'Coche Gama básica',
  group: 'COCHE',
  // Prisma Decimal coerced via Number() in service
  price1Day: 61 as unknown as import('@prisma/client').Prisma.Decimal,
  price2Day: 118 as unknown as import('@prisma/client').Prisma.Decimal,
  price3Day: 154 as unknown as import('@prisma/client').Prisma.Decimal,
  price4Day: 180 as unknown as import('@prisma/client').Prisma.Decimal,
  price5Day: 205 as unknown as import('@prisma/client').Prisma.Decimal,
  price6Day: 224 as unknown as import('@prisma/client').Prisma.Decimal,
  price7Day: 255 as unknown as import('@prisma/client').Prisma.Decimal,
  extraKmRate: 0.15 as unknown as import('@prisma/client').Prisma.Decimal,
  deposit: 300 as unknown as import('@prisma/client').Prisma.Decimal,
  franchise: 300 as unknown as import('@prisma/client').Prisma.Decimal,
  isActive: true,
  order: 1,
  description: null,
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOffice = { id: 'office-zaragoza', slug: 'zaragoza', city: 'Zaragoza', address: 'Calle Test 1', phone: '976000000' };
const mockClient = { id: 'client-1', firstName: 'Ana', lastName: 'López', email: 'ana@test.com', phone: '600123456' };

// Transaction mock — reset return values per test
const tx = {
  category: { findFirst: vi.fn() },
  office: { findUnique: vi.fn() },
  client: { upsert: vi.fn() },
  reservation: { create: vi.fn() },
};

// Base reservation create response
function makeCreatedReservation(totalAmount: number, extraKm = 0, extraKmCharge = 0) {
  return {
    id: 'reservation-1',
    confirmationCode: 'ALC-TESTCODE',
    totalAmount,
    extraKm,
    extraKmCharge,
    extras: [],
    category: { name: mockCategory.name, slug: mockCategory.slug },
    office: { city: mockOffice.city, address: mockOffice.address, phone: mockOffice.phone },
    client: { firstName: mockClient.firstName, lastName: mockClient.lastName, email: mockClient.email },
  };
}

// Valid input shared by service-level tests (3 days: 2026-06-01 → 2026-06-04)
const validInput = {
  categoryId: mockCategory.id,
  officeSlug: 'zaragoza',
  startDate: new Date('2026-06-01'),
  endDate: new Date('2026-06-04'), // 3 days
  estimatedKm: 400,
  extras: [] as Array<{ key: 'BABY_SEAT' | 'SNOW_CHAINS' | 'ADDITIONAL_DRIVER'; quantity: number }>,
  client: { firstName: 'Ana', lastName: 'López', email: 'ana@test.com', phone: '600123456' },
};

// Valid HTTP body for router-level tests (dates as strings)
const validBody = {
  categoryId: mockCategory.id,
  officeSlug: 'zaragoza',
  startDate: '2026-06-01',
  endDate: '2026-06-04', // 3 days
  estimatedKm: 400,
  extras: [],
  client: { firstName: 'Ana', lastName: 'López', email: 'ana@test.com', phone: '600123456' },
};

// ---------------------------------------------------------------------------
// Service-level tests — km scenarios (T1, T2, T3)
// ---------------------------------------------------------------------------
describe('processCheckout — km billing scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(tx));
    // Default happy-path mocks
    tx.category.findFirst.mockResolvedValue(mockCategory);
    tx.office.findUnique.mockResolvedValue(mockOffice);
    tx.client.upsert.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // T1: 3 days, 400 km — included km = 3 * 200 = 600, so extraKm = 0
  it('T1: km within included → extraKm=0, totalAmount=154', async () => {
    tx.reservation.create.mockResolvedValue(makeCreatedReservation(154, 0, 0));

    const result = await processCheckout({ ...validInput, estimatedKm: 400 });

    const createArgs = tx.reservation.create.mock.calls[0][0];
    expect(createArgs.data.extraKm).toBe(0);
    expect(createArgs.data.extraKmCharge).toBe(0);
    expect(createArgs.data.totalAmount).toBe(154);
    expect(result.confirmationCode).toBe('ALC-TESTCODE');
  });

  // T2: 3 days, 800 km — included = 600, extraKm = 200, charge = 200 * 0.15 = 30
  it('T2: km exceeds included → extraKm=200, extraKmCharge=30, totalAmount=184', async () => {
    tx.reservation.create.mockResolvedValue(makeCreatedReservation(184, 200, 30));

    const result = await processCheckout({ ...validInput, estimatedKm: 800 });

    const createArgs = tx.reservation.create.mock.calls[0][0];
    expect(createArgs.data.extraKm).toBe(200);
    expect(createArgs.data.extraKmCharge).toBe(30);
    expect(createArgs.data.totalAmount).toBe(184);
    expect(result.confirmationCode).toBe('ALC-TESTCODE');
  });

  // T3: 3 days, 600 km — exactly at limit, extraKm = 0
  it('T3: km exactly at limit → extraKm=0, totalAmount=154', async () => {
    tx.reservation.create.mockResolvedValue(makeCreatedReservation(154, 0, 0));

    const result = await processCheckout({ ...validInput, estimatedKm: 600 });

    const createArgs = tx.reservation.create.mock.calls[0][0];
    expect(createArgs.data.extraKm).toBe(0);
    expect(createArgs.data.extraKmCharge).toBe(0);
    expect(createArgs.data.totalAmount).toBe(154);
    expect(result.confirmationCode).toBe('ALC-TESTCODE');
  });
});

// ---------------------------------------------------------------------------
// Router-level tests — validation and not-found errors (T4, T5, T6, T7)
// ---------------------------------------------------------------------------
describe('POST /reservations/checkout — router validation & errors', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(prisma, '$transaction').mockImplementation((fn: any) => fn(tx));
    tx.category.findFirst.mockResolvedValue(mockCategory);
    tx.office.findUnique.mockResolvedValue(mockOffice);
    tx.client.upsert.mockResolvedValue(mockClient);
    tx.reservation.create.mockResolvedValue(makeCreatedReservation(154, 0, 0));

    app = Fastify();
    await app.register(reservationsRouter);
    await app.ready();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  // T4: missing estimatedKm → 422 VALIDATION_ERROR
  it('T4: body without estimatedKm → 422 VALIDATION_ERROR', async () => {
    const { estimatedKm: _omit, ...bodyWithoutKm } = validBody;
    const res = await app.inject({
      method: 'POST',
      url: '/reservations/checkout',
      payload: bodyWithoutKm,
    });
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  // T5: missing categoryId → 422 VALIDATION_ERROR
  it('T5: body without categoryId → 422 VALIDATION_ERROR', async () => {
    const { categoryId: _omit, ...bodyWithoutCategory } = validBody;
    const res = await app.inject({
      method: 'POST',
      url: '/reservations/checkout',
      payload: bodyWithoutCategory,
    });
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  // T6: valid CUID but category not found → 404 CATEGORY_NOT_FOUND
  it('T6: category not found → 404 CATEGORY_NOT_FOUND', async () => {
    tx.category.findFirst.mockResolvedValue(null);

    const res = await app.inject({
      method: 'POST',
      url: '/reservations/checkout',
      payload: validBody,
    });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('CATEGORY_NOT_FOUND');
  });

  // T7: category found but office not found → 404 OFFICE_NOT_FOUND
  it('T7: office not found → 404 OFFICE_NOT_FOUND', async () => {
    tx.office.findUnique.mockResolvedValue(null);

    const res = await app.inject({
      method: 'POST',
      url: '/reservations/checkout',
      payload: validBody,
    });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('OFFICE_NOT_FOUND');
  });
});
