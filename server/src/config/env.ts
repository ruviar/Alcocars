import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Direct connection for Prisma migrations (Supabase pooler workaround)
  DIRECT_URL: z.string().optional(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Accepts one or multiple origins separated by commas
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  // === Email (API de Brevo sobre HTTPS) ===
  // Sin BREVO_API_KEY el sistema no rompe: escribe una vista previa del correo
  // en server/.mail-preview/ y lo registra como SKIPPED en email_logs.
  BREVO_API_KEY: z.string().optional(),
  /** Remitente verificado en Brevo. Formato: `Alcocars <reservas@dominio.es>` */
  SMTP_FROM: z.string().optional(),
  /** Buzón interno que recibe los avisos de reservas y contacto */
  NOTIFY_EMAIL: z.string().email('NOTIFY_EMAIL debe ser un email válido').default('ruviar@gmail.com'),
});

// Treat empty strings as absent (common in Docker/CI environments)
const rawEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, v]) => v !== ''),
);

const result = schema.safeParse(rawEnv);

if (!result.success) {
  console.error('❌ Invalid environment variables:');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

// Enforce strong JWT_SECRET in production
if (result.data.NODE_ENV === 'production' && result.data.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters in production');
  process.exit(1);
}

// Un despliegue en producción sin email configurado significa perder reservas
// en silencio: se avisa alto y claro en el arranque.
if (result.data.NODE_ENV === 'production' && !(result.data.BREVO_API_KEY && result.data.SMTP_FROM)) {
  console.warn(
    '⚠️  Email sin configurar (falta BREVO_API_KEY y/o SMTP_FROM). ' +
      'Las solicitudes de reserva se guardarán en la base de datos, pero NO se enviará ningún aviso.',
  );
}

export const env = result.data;
