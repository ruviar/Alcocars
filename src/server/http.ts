import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { getSession, type AdminSession } from './auth/session';

/**
 * Utilidades compartidas por las rutas de la API.
 *
 * Sustituyen lo que antes daba Fastify (validación + mapeo de errores + hook de
 * autenticación) manteniendo exactamente los mismos códigos y cuerpos de
 * respuesta, para que el frontend no note el cambio.
 */

export function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** 422 con el mismo formato que devolvía Fastify. */
export function validationError(issues: z.ZodError) {
  return NextResponse.json(
    { error: 'VALIDATION_ERROR', details: issues.flatten().fieldErrors },
    { status: 422 },
  );
}

/**
 * Valida el cuerpo JSON con un esquema Zod. Devuelve o los datos o la respuesta
 * de error, para poder hacer `if ('response' in parsed) return parsed.response`.
 */
export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: jsonError('INVALID_JSON', 400) };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { response: validationError(parsed.error) };

  return { data: parsed.data };
}

/** Valida los search params con un esquema Zod. */
export function parseQuery<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): { data: z.infer<T> } | { response: NextResponse } {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) return { response: validationError(parsed.error) };
  return { data: parsed.data };
}

/**
 * Traduce un error de negocio a su código HTTP. Cualquier código desconocido
 * cae en `fallback` (422 por defecto) en lugar de convertirse en un 500 opaco.
 */
export function businessError(
  message: string,
  statusByError: Record<string, number>,
  fallback = 422,
) {
  return jsonError(message, statusByError[message] ?? fallback);
}

/** Envuelve un handler y registra cualquier error inesperado como 500. */
export function withErrorLogging<A extends unknown[]>(
  handler: (request: Request, ...args: A) => Promise<NextResponse>,
) {
  return async (request: Request, ...args: A): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (err) {
      console.error(`[API] ${request.method} ${new URL(request.url).pathname}`, err);
      return jsonError('INTERNAL_ERROR', 500);
    }
  };
}

/**
 * Exige sesión de administrador. Devuelve la sesión o una respuesta 401 con el
 * mismo código que esperaba el cliente del panel.
 */
export async function requireAdmin(): Promise<
  { session: AdminSession } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { response: jsonError('UNAUTHORIZED', 401) };
  return { session };
}
