import { z } from 'zod';

export const checkoutBodySchema = z.object({
  vehicleId: z.string().min(1),
  officeSlug: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  extras: z
    .array(z.enum(['BABY_SEAT', 'SNOW_CHAINS', 'ADDITIONAL_DRIVER']))
    .default([]),
  client: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
  }),
  notes: z.string().max(500).optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
