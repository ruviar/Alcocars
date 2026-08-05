import { z } from 'zod';
import { EXTRAS, RENTAL_RULES, TARIFFS } from '../../config/catalog';

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD');
const TIME = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato esperado: HH:mm');

const tariffIdSchema = z.enum(TARIFFS.map((tariff) => tariff.id) as [string, ...string[]]);
const extraIdSchema = z.enum(EXTRAS.map((extra) => extra.id) as [string, ...string[]]);

const checkoutExtraSchema = z.object({
  id: extraIdSchema,
  quantity: z.number().int().min(1).max(4),
});

export const checkoutBodySchema = z
  .object({
    tariffId: tariffIdSchema,
    pickupOfficeSlug: z.string().min(1),
    returnOfficeSlug: z.string().min(1),
    pickupDate: DATE,
    pickupTime: TIME,
    returnDate: DATE,
    returnTime: TIME,
    plannedKm: z.number().int().min(1).max(50_000),
    extras: z.array(checkoutExtraSchema).max(EXTRAS.length).default([]),
    client: z.object({
      firstName: z.string().trim().min(1, 'Nombre requerido').max(80),
      lastName: z.string().trim().min(1, 'Apellidos requeridos').max(120),
      email: z.string().trim().email('Email inválido').max(160),
      phone: z.string().trim().min(6, 'Teléfono requerido').max(32),
    }),
    notes: z.string().trim().max(1000).optional(),
    /** Aceptación expresa de la política de privacidad (RGPD) */
    consent: z.literal(true, {
      errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.returnDate < value.pickupDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['returnDate'],
        message: 'La devolución no puede ser anterior a la recogida',
      });
      return;
    }

    // El alquiler mínimo es de 24 h: mismo día no vale.
    if (value.returnDate === value.pickupDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['returnDate'],
        message: `El alquiler mínimo es de ${RENTAL_RULES.minRentalHours} horas`,
      });
    }

    const duplicated = new Set<string>();
    for (const extra of value.extras) {
      if (duplicated.has(extra.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['extras'],
          message: `Extra repetido: ${extra.id}`,
        });
      }
      duplicated.add(extra.id);
    }
  });

export const categoryAvailabilityQuerySchema = z.object({
  officeSlug: z.string().min(1),
  startDate: DATE,
  endDate: DATE,
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
export type CheckoutExtra = z.infer<typeof checkoutExtraSchema>;
export type CategoryAvailabilityQuery = z.infer<typeof categoryAvailabilityQuerySchema>;
