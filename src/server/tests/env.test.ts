import { afterEach, describe, expect, it, vi } from 'vitest';

describe('env config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('lanza cuando falta DATABASE_URL', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const { getEnv } = await import('../config/env');
    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });

  it('la validación es perezosa: importar el módulo no lanza', async () => {
    vi.stubEnv('DATABASE_URL', '');
    // En serverless un error al importar tumbaría la función entera; debe
    // ocurrir al usar la configuración, no al cargarla.
    await expect(import('../config/env')).resolves.toBeDefined();
  });

  it('aplica el buzón de avisos por defecto', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://x:x@localhost:5432/x');
    vi.stubEnv('NOTIFY_EMAIL', '');
    const { getEnv } = await import('../config/env');
    expect(getEnv().NOTIFY_EMAIL).toBe('ruviar@gmail.com');
  });

  it('exige un JWT_SECRET largo en producción', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://x:x@localhost:5432/x');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', 'corto');
    const { getEnv } = await import('../config/env');
    expect(() => getEnv()).toThrow(/32 caracteres/);
  });
});
