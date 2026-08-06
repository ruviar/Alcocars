/**
 * Estado inicial del asistente de reserva codificado en la query de /reserva.
 *
 * Con React Router viajaba en el `state` de la navegación; en Next se lleva en
 * la URL, que además es compartible y sobrevive a una recarga:
 *   /reserva?gama=coche-media&recogida=Zaragoza&desde=2026-09-12&hasta=2026-09-15
 */

export interface ReservaParams {
  /** ciudad de recogida tal y como la maneja la navegación */
  location?: string;
  /** id de gama del catálogo (tariffId) */
  tariffId?: string;
  /** supercategoría o texto de gama del buscador («Turismos», «4×4»…) */
  category?: string;
  /** fechas YYYY-MM-DD */
  from?: string;
  to?: string;
}

function toIso(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildReservaHref(params: {
  location?: string;
  tariffId?: string;
  category?: string;
  from?: Date;
  to?: Date;
}): string {
  const query = new URLSearchParams();
  if (params.location) query.set('recogida', params.location);
  if (params.tariffId) query.set('gama', params.tariffId);
  if (params.category) query.set('categoria', params.category);
  if (params.from) query.set('desde', toIso(params.from));
  if (params.to) query.set('hasta', toIso(params.to));

  const qs = query.toString();
  return qs ? `/reserva?${qs}` : '/reserva';
}

export function parseReservaParams(searchParams: URLSearchParams): ReservaParams {
  const isDate = (value: string | null): value is string =>
    Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

  const from = searchParams.get('desde');
  const to = searchParams.get('hasta');

  return {
    location: searchParams.get('recogida') ?? undefined,
    tariffId: searchParams.get('gama') ?? undefined,
    category: searchParams.get('categoria') ?? undefined,
    from: isDate(from) ? from : undefined,
    to: isDate(to) ? to : undefined,
  };
}
