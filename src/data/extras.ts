/**
 * Catálogo de extras publicado en la web.
 *
 * Copia editorial del catálogo del servidor (`server/src/config/catalog.ts`),
 * que es quien manda a la hora de cobrar. El test
 * `server/src/tests/catalog-parity.test.ts` falla si los importes divergen.
 */

export type ExtraUnit = 'per_rental' | 'per_day';

export interface ExtraEntry {
  id: string;
  label: string;
  hint?: string;
  /** precio unitario en € (por alquiler o por día, según `unit`) */
  price: number;
  unit: ExtraUnit;
  /** tope máximo por alquiler y unidad (solo en `per_day`) */
  maxPerRental?: number;
  maxQuantity: number;
}

export const extras: ExtraEntry[] = [
  {
    id: 'cityAfterHoursOffice',
    label: 'Entregas y recogidas en oficinas de ciudad fuera del horario laboral',
    price: 25,
    unit: 'per_rental',
    maxQuantity: 1,
  },
  {
    id: 'cityOutsideOffice',
    label: 'Entregas y recogidas fuera de oficina (hoteles, Renfe, estaciones marítimas)',
    price: 40,
    unit: 'per_rental',
    maxQuantity: 1,
  },
  {
    id: 'airportBusinessHours',
    label: 'Entregas y recogidas en aeropuerto durante el horario laboral',
    price: 40,
    unit: 'per_rental',
    maxQuantity: 1,
  },
  {
    id: 'differentOfficeReturn',
    label: 'Devolución en una oficina de Alcocars distinta a la de recogida',
    price: 69.6,
    unit: 'per_rental',
    maxQuantity: 1,
  },
  {
    id: 'skiRackChains',
    label: 'Porta esquís / cadenas de nieve',
    price: 34.8,
    unit: 'per_rental',
    maxQuantity: 1,
  },
  {
    id: 'additionalDriver',
    label: 'Conductor adicional',
    hint: 'Cada conductor debe cumplir los mismos requisitos: 25 años y 2 de carnet.',
    price: 8,
    unit: 'per_rental',
    maxQuantity: 4,
  },
  {
    id: 'babySeat',
    label: 'Silla de bebé',
    hint: 'Máximo 46,40 € por alquiler y silla.',
    price: 5.22,
    unit: 'per_day',
    maxPerRental: 46.4,
    maxQuantity: 4,
  },
];

/** Importe total de un extra según los días contratados y la cantidad. */
export function extraTotal(extra: ExtraEntry, quantity: number, totalDays: number): number {
  const raw = extra.unit === 'per_day' ? extra.price * quantity * totalDays : extra.price * quantity;
  const cap = extra.maxPerRental !== undefined ? extra.maxPerRental * quantity : undefined;
  const value = cap !== undefined ? Math.min(raw, cap) : raw;

  return Math.round((value + Number.EPSILON) * 100) / 100;
}
