import { z } from 'zod';

const categorySchema = z.enum(['TURISMOS', 'FURGONETAS', 'SUV_4X4', 'AUTOCARAVANAS']);

const checkoutExtraSchema = z.object({
  key: z.enum(['BABY_SEAT', 'SNOW_CHAINS', 'ADDITIONAL_DRIVER']),
  quantity: z.number().int().min(1),
});

export const checkoutBodySchema = z.object({
  category: categorySchema,
  officeSlug: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  plannedKm: z.number().int().min(1).max(50000),
  extras: z.array(checkoutExtraSchema).default([]),
  client: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
  }),
  notes: z.string().max(500).optional(),
});

export const categoryAvailabilityQuerySchema = z.object({
  officeSlug: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
export type CheckoutExtra = z.infer<typeof checkoutExtraSchema>;
export type CategoryAvailabilityQuery = z.infer<typeof categoryAvailabilityQuerySchema>;
