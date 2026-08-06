/**
 * Catálogo canónico de tarifas, extras y reglas de alquiler.
 *
 * Esta es la ÚNICA fuente de verdad para cualquier importe que se cobre o se
 * comunique al cliente. El frontend mantiene una copia editorial en
 * `src/data/tariffs.ts` para poder pintar precios sin depender de la API; el
 * test `catalog-parity.test.ts` falla si ambas divergen.
 *
 * Importes en euros, IVA incluido, tal y como se publican en la web.
 */

export const SUPER_CATEGORIES = ['Coches', 'Furgonetas', 'Todoterrenos', 'Autocaravanas'] as const;
export type SuperCategory = (typeof SUPER_CATEGORIES)[number];

export interface TariffEntry {
  id: string;
  name: string;
  superCategory: SuperCategory;
  /** true → sin precio fijo publicado, se cotiza a mano */
  consultOnly?: boolean;
  /** precio total para 1..7 días (índice 0 = 1 día) */
  rates: number[];
  /** €/km una vez superados los km incluidos */
  kmExtra: number;
  /** fianza en € */
  deposit: number;
  /** franquicia del seguro en € */
  franchise: number;
  /** km incluidos por día */
  kmPerDay: number;
}

export const TARIFFS: TariffEntry[] = [
  // ── COCHES ────────────────────────────────────────────────────────────────
  { id: 'coche-basica', name: 'Coche Gama Básica', superCategory: 'Coches', rates: [61, 118, 154, 180, 205, 224, 255], kmExtra: 0.15, deposit: 300, franchise: 300, kmPerDay: 200 },
  { id: 'coche-media', name: 'Coche Gama Media', superCategory: 'Coches', rates: [81, 154, 205, 241, 275, 296, 337], kmExtra: 0.20, deposit: 300, franchise: 300, kmPerDay: 200 },
  { id: 'coche-alta', name: 'Coche Gama Alta', superCategory: 'Coches', rates: [102, 198, 273, 323, 374, 403, 465], kmExtra: 0.25, deposit: 300, franchise: 300, kmPerDay: 200 },

  // ── FURGONETAS ────────────────────────────────────────────────────────────
  { id: 'furg-transp-5p', name: 'Furgoneta Transporte 5 Pasajeros', superCategory: 'Furgonetas', rates: [81, 157, 224, 287, 332, 394, 421], kmExtra: 0.17, deposit: 300, franchise: 300, kmPerDay: 200 },
  { id: 'furg-transp-6p', name: 'Furgoneta Transporte 6 Pasajeros', superCategory: 'Furgonetas', rates: [125, 227, 318, 404, 453, 510, 590], kmExtra: 0.22, deposit: 300, franchise: 300, kmPerDay: 200 },
  { id: 'furg-transp-9p', name: 'Furgoneta Transporte 9 Pasajeros', superCategory: 'Furgonetas', rates: [171, 295, 402, 482, 535, 602, 680], kmExtra: 0.27, deposit: 600, franchise: 600, kmPerDay: 200 },
  { id: 'furg-carga-2p', name: 'Furgoneta Carga 2 Pasajeros', superCategory: 'Furgonetas', rates: [73, 143, 205, 255, 306, 362, 408], kmExtra: 0.17, deposit: 300, franchise: 300, kmPerDay: 200 },
  { id: 'furg-carga-3p', name: 'Furgoneta Carga 3 Pasajeros', superCategory: 'Furgonetas', rates: [113, 201, 284, 352, 402, 453, 521], kmExtra: 0.22, deposit: 300, franchise: 300, kmPerDay: 200 },
  { id: 'furg-carga-12m3', name: 'Furgoneta Carga 12m³ y 3 Pasajeros', superCategory: 'Furgonetas', rates: [136, 244, 340, 426, 499, 556, 635], kmExtra: 0.25, deposit: 300, franchise: 300, kmPerDay: 200 },
  { id: 'furg-caja-abierta', name: 'Furgoneta Carga Caja Abierta', superCategory: 'Furgonetas', rates: [138, 275, 413, 515, 644, 772, 855], kmExtra: 0.25, deposit: 600, franchise: 600, kmPerDay: 200 },

  // ── TODOTERRENOS ──────────────────────────────────────────────────────────
  { id: 'tt-corto', name: 'Todoterreno Corto', superCategory: 'Todoterrenos', rates: [171, 295, 402, 482, 535, 602, 680], kmExtra: 0.27, deposit: 600, franchise: 600, kmPerDay: 200 },
  { id: 'tt-largo', name: 'Todoterreno Largo', superCategory: 'Todoterrenos', rates: [205, 340, 468, 590, 766, 808, 850], kmExtra: 0.27, deposit: 600, franchise: 600, kmPerDay: 200 },
  { id: 'tt-pickup', name: 'Todoterreno Pick-Up', superCategory: 'Todoterrenos', rates: [205, 340, 468, 590, 766, 808, 850], kmExtra: 0.27, deposit: 600, franchise: 600, kmPerDay: 200 },

  // ── AUTOCARAVANAS ─────────────────────────────────────────────────────────
  { id: 'autocaravana', name: 'Autocaravana', superCategory: 'Autocaravanas', consultOnly: true, rates: [], kmExtra: 0, deposit: 0, franchise: 0, kmPerDay: 200 },
];

/** Unidad de facturación de un extra. */
export type ExtraUnit = 'per_rental' | 'per_day';

export interface ExtraEntry {
  id: string;
  label: string;
  /** descripción corta para el resumen y el email */
  hint?: string;
  price: number;
  unit: ExtraUnit;
  /** tope máximo por alquiler (solo aplica a unit === 'per_day') */
  maxPerRental?: number;
  /** cuántas unidades se pueden contratar (conductor adicional, sillas…) */
  maxQuantity: number;
}

export const EXTRAS: ExtraEntry[] = [
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

/** Reglas de alquiler publicadas en «Condiciones de alquiler». */
export const RENTAL_RULES = {
  includedKmPerDay: 200,
  minRentalHours: 24,
  /** margen de cortesía en la devolución antes de cobrar un día extra */
  returnGraceMinutes: 60,
  minDriverAge: 25,
  minLicenceYears: 2,
  /** cargo por servicio de repostaje si el depósito no vuelve lleno (+ IVA) */
  refuelServiceFee: 20,
  /** tope de días que acepta el formulario web; por encima se cotiza a mano */
  maxRentalDays: 90,
} as const;

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getTariff(tariffId: string): TariffEntry | null {
  return TARIFFS.find((tariff) => tariff.id === tariffId) ?? null;
}

export function getExtra(extraId: string): ExtraEntry | null {
  return EXTRAS.find((extra) => extra.id === extraId) ?? null;
}

/**
 * Precio base del alquiler para `totalDays` días.
 *
 * Hasta 7 días se usa la tarifa publicada. Por encima se extrapola por semanas
 * completas al precio de 7 días más el resto a la tarifa del tramo suelto, que
 * es como se venía calculando en el wizard del frontend.
 *
 * Devuelve null cuando la gama no tiene precio publicado (`consultOnly`).
 */
export function getBaseRate(tariff: TariffEntry, totalDays: number): number | null {
  if (totalDays <= 0) return 0;
  if (tariff.consultOnly || tariff.rates.length === 0) return null;

  if (totalDays <= tariff.rates.length) {
    return tariff.rates[totalDays - 1] ?? null;
  }

  const weekRate = tariff.rates[tariff.rates.length - 1];
  if (weekRate === undefined) return null;

  const fullWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;
  const remainingRate =
    remainingDays > 0 ? tariff.rates[Math.min(remainingDays, tariff.rates.length) - 1] ?? weekRate : 0;

  return roundCurrency(fullWeeks * weekRate + remainingRate);
}

export interface QuotedExtra {
  id: string;
  label: string;
  quantity: number;
  unit: ExtraUnit;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  tariffId: string;
  tariffName: string;
  superCategory: SuperCategory;
  totalDays: number;
  /** null cuando la gama es «bajo consulta» */
  baseTotal: number | null;
  includedKm: number;
  plannedKm: number;
  extraKm: number;
  extraKmRate: number;
  extraKmSurcharge: number;
  extras: QuotedExtra[];
  extrasTotal: number;
  /** null cuando la gama es «bajo consulta» */
  totalAmount: number | null;
  deposit: number;
  franchise: number;
}

export interface QuoteInput {
  tariffId: string;
  totalDays: number;
  plannedKm: number;
  extras: Array<{ id: string; quantity: number }>;
}

export class QuoteError extends Error {}

/**
 * Calcula el presupuesto completo en el servidor. Nunca se confía en importes
 * enviados por el cliente: solo en el id de gama, los días, los km y los extras.
 */
export function buildQuote(input: QuoteInput): Quote {
  const tariff = getTariff(input.tariffId);
  if (!tariff) throw new QuoteError('TARIFF_NOT_FOUND');

  const { totalDays, plannedKm } = input;
  if (!Number.isInteger(totalDays) || totalDays < 1) throw new QuoteError('INVALID_DATE_RANGE');
  if (totalDays > RENTAL_RULES.maxRentalDays) throw new QuoteError('MAX_RENTAL_DAYS_EXCEEDED');

  const baseTotal = getBaseRate(tariff, totalDays);
  const includedKm = tariff.kmPerDay * totalDays;
  const extraKm = Math.max(plannedKm - includedKm, 0);
  const extraKmSurcharge = roundCurrency(extraKm * tariff.kmExtra);

  const extras: QuotedExtra[] = input.extras.map(({ id, quantity }) => {
    const extra = getExtra(id);
    if (!extra) throw new QuoteError('EXTRA_NOT_FOUND');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > extra.maxQuantity) {
      throw new QuoteError('INVALID_EXTRA_QUANTITY');
    }

    const rawTotal =
      extra.unit === 'per_day' ? extra.price * quantity * totalDays : extra.price * quantity;

    const cap = extra.maxPerRental !== undefined ? extra.maxPerRental * quantity : undefined;
    const totalPrice = roundCurrency(cap !== undefined ? Math.min(rawTotal, cap) : rawTotal);

    return {
      id: extra.id,
      label: extra.label,
      quantity,
      unit: extra.unit,
      unitPrice: extra.price,
      totalPrice,
    };
  });

  const extrasTotal = roundCurrency(extras.reduce((sum, extra) => sum + extra.totalPrice, 0));

  return {
    tariffId: tariff.id,
    tariffName: tariff.name,
    superCategory: tariff.superCategory,
    totalDays,
    baseTotal,
    includedKm,
    plannedKm,
    extraKm,
    extraKmRate: tariff.kmExtra,
    extraKmSurcharge,
    extras,
    extrasTotal,
    totalAmount: baseTotal === null ? null : roundCurrency(baseTotal + extraKmSurcharge + extrasTotal),
    deposit: tariff.deposit,
    franchise: tariff.franchise,
  };
}
