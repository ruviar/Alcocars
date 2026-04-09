import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { listCategories } from '../modules/categories/categories.service';
import { categoriesRouter } from '../modules/categories/categories.router';

const mockCategories = [
  {
    id: '1', slug: 'coche-gama-basica', group: 'COCHE', order: 1,
    name: 'Gama Básica', description: null, imageUrl: null, isActive: true,
    price1Day: 45, price2Day: 40, price3Day: 37, price4Day: 35,
    price5Day: 33, price6Day: 31, price7Day: 29,
    extraKmRate: 0.15, deposit: 300, franchise: 600,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: '2', slug: 'coche-gama-media', group: 'COCHE', order: 2,
    name: 'Gama Media', description: null, imageUrl: null, isActive: true,
    price1Day: 55, price2Day: 50, price3Day: 47, price4Day: 45,
    price5Day: 43, price6Day: 41, price7Day: 39,
    extraKmRate: 0.18, deposit: 400, franchise: 800,
    createdAt: new Date(), updatedAt: new Date(),
  },
];

describe('listCategories service', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns active categories ordered by group then order', async () => {
    vi.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);

    const result = await listCategories();

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ group: 'asc' }, { order: 'asc' }],
    });
    expect(result).toHaveLength(2);
  });

  it('serializes Decimal fields to numbers', async () => {
    vi.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);

    const result = await listCategories();

    for (const cat of result) {
      expect(cat).toHaveProperty('slug');
      expect(cat).toHaveProperty('price1Day');
      expect(cat).toHaveProperty('price7Day');
      expect(cat).toHaveProperty('extraKmRate');
      expect(cat).toHaveProperty('deposit');
      expect(cat).toHaveProperty('franchise');
      expect(typeof cat.price1Day).toBe('number');
      expect(typeof cat.extraKmRate).toBe('number');
      expect(typeof cat.deposit).toBe('number');
    }
  });

  it('first result has group COCHE and slug coche-gama-basica', async () => {
    vi.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);

    const result = await listCategories();

    expect(result[0].group).toBe('COCHE');
    expect(result[0].slug).toBe('coche-gama-basica');
  });
});

describe('GET /categories router', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    await app.register(categoriesRouter);
    await app.ready();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  it('returns 200 with array of categories', async () => {
    vi.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);

    const res = await app.inject({ method: 'GET', url: '/categories' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('all categories have required pricing fields as numbers', async () => {
    vi.spyOn(prisma.category, 'findMany').mockResolvedValue(mockCategories as any);

    const res = await app.inject({ method: 'GET', url: '/categories' });
    const body = JSON.parse(res.body);
    for (const cat of body) {
      expect(cat).toHaveProperty('slug');
      expect(cat).toHaveProperty('price1Day');
      expect(cat).toHaveProperty('price7Day');
      expect(cat).toHaveProperty('extraKmRate');
      expect(cat).toHaveProperty('deposit');
      expect(cat).toHaveProperty('franchise');
      expect(typeof cat.price1Day).toBe('number');
      expect(typeof cat.extraKmRate).toBe('number');
    }
  });
});
