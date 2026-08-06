// En desarrollo queda vacío y manda el rewrite de next.config (proxy a :3001);
// en producción se hornea NEXT_PUBLIC_API_BASE_URL en el bundle.
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const BASE = RAW_BASE.replace(/\/$/, '');

export function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${normalizedPath}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; details?: unknown };
    const error = new Error(body.error ?? `HTTP ${res.status}`) as Error & {
      status?: number;
      details?: unknown;
    };
    error.status = res.status;
    error.details = body.details;
    throw error;
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
