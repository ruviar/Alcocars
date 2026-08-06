import type { AdminUser } from './auth';

/**
 * Cliente de la API de administración.
 *
 * La sesión viaja en una cookie `httpOnly` que el navegador adjunta sola: aquí
 * ya no se manipula ningún token (antes iba en localStorage, legible por
 * cualquier script). Solo hace falta `credentials: 'same-origin'`.
 */

/** El token ha caducado o no es válido: hay que volver a iniciar sesión. */
export class AdminAuthError extends Error {
  constructor() {
    super('SESSION_EXPIRED');
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (res.status === 401) {
    throw new AdminAuthError();
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

export async function login(email: string, password: string): Promise<AdminUser> {
  const { user } = await request<{ user: AdminUser }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return user;
}

export async function logout(): Promise<void> {
  await request('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
}

/** Sesión actual según el servidor (la cookie no es legible desde el JS). */
export async function fetchSession(): Promise<AdminUser | null> {
  try {
    const { user } = await request<{ user: AdminUser | null }>('/api/admin/session');
    return user;
  } catch {
    return null;
  }
}
