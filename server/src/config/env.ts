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
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
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

export const env = result.data;
