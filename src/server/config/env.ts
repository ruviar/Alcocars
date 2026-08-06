import { z } from 'zod';

/**
 * Variables de entorno del lado servidor.
 *
 * En Vercel las inyecta la plataforma; en local salen de `.env.local`, que Next
 * carga automáticamente (por eso ya no hace falta `dotenv/config`).
 *
 * A diferencia de la versión con servidor propio, aquí NO se hace
 * `process.exit()`: en serverless eso tumbaría la función entera. Un problema
 * de configuración lanza al usarse, para que quede en los logs de la petición.
 */

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  /** Conexión directa para las migraciones de Prisma (sin el pooler de Supabase) */
  DIRECT_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET es obligatoria'),
  // === Email (API de Brevo sobre HTTPS) ===
  // Sin BREVO_API_KEY el sistema no rompe: registra el envío como SKIPPED en
  // email_logs (y en local escribe una vista previa en .mail-preview/).
  BREVO_API_KEY: z.string().optional(),
  /** Remitente verificado en Brevo. Formato: `Alcocars <reservas@dominio.es>` */
  SMTP_FROM: z.string().optional(),
  /** Buzón interno que recibe los avisos de reservas y contacto */
  NOTIFY_EMAIL: z.string().email('NOTIFY_EMAIL debe ser un email válido').default('ruviar@gmail.com'),
});

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  // Las cadenas vacías cuentan como ausentes (habitual en paneles de hosting)
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''));
  const result = schema.safeParse(raw);

  if (!result.success) {
    const detail = JSON.stringify(result.error.flatten().fieldErrors);
    throw new Error(`Variables de entorno inválidas: ${detail}`);
  }

  if (result.data.NODE_ENV === 'production') {
    if (result.data.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción');
    }

    // Un despliegue sin email configurado significa perder reservas en
    // silencio: se avisa alto y claro en los logs.
    if (!(result.data.BREVO_API_KEY && result.data.SMTP_FROM)) {
      console.warn(
        '⚠️  Email sin configurar (falta BREVO_API_KEY y/o SMTP_FROM). ' +
          'Las solicitudes de reserva se guardarán en la base de datos, pero NO se enviará ningún aviso.',
      );
    }
  }

  return result.data;
}

let cached: Env | null = null;

/** Lectura perezosa y memorizada: no se valida al importar el módulo. */
export function getEnv(): Env {
  cached ??= loadEnv();
  return cached;
}

/**
 * Acceso cómodo (`env.NOTIFY_EMAIL`) manteniendo la lectura perezosa: el Proxy
 * resuelve cada propiedad en el momento de usarla, no al cargar el módulo.
 */
export const env = new Proxy({} as Env, {
  get: (_target, prop: string) => getEnv()[prop as keyof Env],
}) as Env;
