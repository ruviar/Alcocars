import { z } from 'zod';

const checkoutExtraSchema = z.object({
  key: z.enum(['BABY_SEAT', 'SNOW_CHAINS', 'ADDITIONAL_DRIVER']),
  quantity: z.number().int().min(1),
});

export const checkoutBodySchema = z.object({
  vehicleId: z.string().min(1),
  officeSlug: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  extras: z.array(checkoutExtraSchema).default([]),
  client: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
  }),
  notes: z.string().max(500).optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
export type CheckoutExtra = z.infer<typeof checkoutExtraSchema>;
