import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env';

/**
 * Sesión del panel de administración.
 *
 * El token va en una cookie `httpOnly` + `sameSite=lax` + `secure` en
 * producción, no en localStorage: así JavaScript no puede leerlo y un XSS no
 * se lleva la sesión. Esto es posible porque la web y la API comparten dominio
 * desde que todo vive en la misma app de Next.
 */

export const SESSION_COOKIE = 'alcocars_admin_session';
const MAX_AGE_SECONDS = 8 * 60 * 60; // 8 h, igual que el JWT anterior

export interface AdminSession {
  id: string;
  email: string;
  name: string;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function createSessionToken(user: AdminSession): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (!payload.sub || typeof payload.email !== 'string' || typeof payload.name !== 'string') {
      return null;
    }
    return { id: payload.sub, email: payload.email, name: payload.name };
  } catch {
    // Token caducado, manipulado o firmado con otro secreto
    return null;
  }
}

/** Opciones de la cookie de sesión, compartidas al crear y al borrar. */
function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export async function startSession(user: AdminSession): Promise<void> {
  const token = await createSessionToken(user);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(MAX_AGE_SECONDS));
}

export async function endSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, '', cookieOptions(0));
}

/** Sesión actual, o null si no hay cookie válida. */
export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
