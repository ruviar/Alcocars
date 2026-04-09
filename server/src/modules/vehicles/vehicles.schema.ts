import { z } from 'zod';

export const vehicleQuerySchema = z.object({
  officeSlug: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export type VehicleQuery = z.infer<typeof vehicleQuerySchema>;
