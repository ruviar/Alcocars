import { describe, expect, it, vi } from 'vitest';

// `next/headers` solo existe en petición: para probar la firma del token basta
// con las funciones puras (createSessionToken / verifySessionToken).
vi.mock('next/headers', () => ({ cookies: () => ({ get: () => undefined, set: () => undefined }) }));

const { createSessionToken, verifySessionToken } = await import('../auth/session');

const user = { id: 'admin-1', email: 'admin@alcocars.es', name: 'Administrador' };

describe('sesión del panel', () => {
  it('firma y verifica un token con los datos del administrador', async () => {
    const token = await createSessionToken(user);
    await expect(verifySessionToken(token)).resolves.toEqual(user);
  });

  it('rechaza un token manipulado', async () => {
    const token = await createSessionToken(user);
    const tampered = `${token.slice(0, -3)}xyz`;
    await expect(verifySessionToken(tampered)).resolves.toBeNull();
  });

  it('rechaza basura y cadenas vacías', async () => {
    await expect(verifySessionToken('no-es-un-jwt')).resolves.toBeNull();
    await expect(verifySessionToken('')).resolves.toBeNull();
  });

  it('rechaza un token firmado con otro secreto', async () => {
    const { SignJWT } = await import('jose');
    const otherSecret = new TextEncoder().encode('otro-secreto-completamente-distinto-32c');
    const foreign = await new SignJWT({ email: user.email, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(otherSecret);

    await expect(verifySessionToken(foreign)).resolves.toBeNull();
  });
});
