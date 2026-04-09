const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
const BASE = RAW_BASE.replace(/\/$/, '');

type ApiErrorBody = {
  error?: string;
  details?: unknown;
};

type HttpError = Error & {
  status?: number;
  details?: unknown;
};

function buildUrl(path: string): string {
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
    const body = await res.json().catch(() => ({}) as ApiErrorBody);
    const error = new Error(body.error ?? `HTTP ${res.status}`) as HttpError;
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
