import { z } from 'zod';

export const contactBodySchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(6, 'Teléfono requerido'),
  mensaje: z.string().min(1, 'Mensaje requerido').max(2000),
});

export type ContactBody = z.infer<typeof contactBodySchema>;
