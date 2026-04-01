import { describe, it, expect, vi, afterEach } from 'vitest';

describe('env config', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('throws when DATABASE_URL is missing', async () => {
    vi.stubEnv('DATABASE_URL', '');
    await expect(import('../config/env')).rejects.toThrow();
    vi.unstubAllEnvs();
  });

  it('parses PORT as number and defaults to 3001', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://x:x@localhost:5432/x');
    vi.stubEnv('PORT', '');
    const mod = await import('../config/env');
    expect(mod.env.PORT).toBe(3001);
    vi.unstubAllEnvs();
  });
});
