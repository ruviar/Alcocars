import { z } from 'zod';

export const RESERVATION_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
] as const;

export const listReservationsQuerySchema = z.object({
  status: z.enum(RESERVATION_STATUSES).optional(),
  /** solo solicitudes marcadas para revisar disponibilidad */
  needsCheck: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  /** busca en código, nombre, email y teléfono del cliente */
  search: z.string().trim().max(120).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateStatusBodySchema = z.object({
  status: z.enum(RESERVATION_STATUSES),
});

export const updateReservationBodySchema = z
  .object({
    /** unidad asignada; null para desasignar */
    vehicleId: z.string().min(1).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((value) => value.vehicleId !== undefined || value.notes !== undefined, {
    message: 'Nada que actualizar',
  });

export type ListReservationsQuery = z.infer<typeof listReservationsQuerySchema>;
export type UpdateStatusBody = z.infer<typeof updateStatusBodySchema>;
export type UpdateReservationBody = z.infer<typeof updateReservationBodySchema>;
