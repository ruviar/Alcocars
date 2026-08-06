/**
 * Identidad del usuario del panel.
 *
 * La sesión en sí vive en una cookie `httpOnly` que este código NO puede leer
 * (eso es lo que la hace segura frente a XSS). Aquí solo se guarda el nombre y
 * el email para pintarlos en la barra lateral sin una petición extra; la
 * autoridad sobre «¿hay sesión?» es siempre `GET /api/admin/session`.
 */

const USER_KEY = 'alcocars.admin.user';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export function getCachedUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function cacheUser(user: AdminUser): void {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCachedUser(): void {
  window.localStorage.removeItem(USER_KEY);
}
