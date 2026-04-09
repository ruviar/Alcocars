// KEEP IN SYNC with src/lib/pricing.ts (frontend mirror)

export const KM_INCLUDED_PER_DAY = 200;
export const MAX_DAYS = 7;

/** Shape of a Category's pricing fields (Decimal coerced to number before calling) */
export interface CategoryRates {
  price1Day: number;
  price2Day: number;
  price3Day: number;
  price4Day: number;
  price5Day: number;
  price6Day: number;
  price7Day: number;
  extraKmRate: number;
  deposit: number;
  franchise: number;
}

export interface PriceInput {
  category: CategoryRates;
  days: number;       // 1..7 — throws if outside range
  estimatedKm: number;
  extrasTotal: number;
}

export interface PriceBreakdown {
  days: number;
  includedKm: number;
  extraKm: number;
  baseRate: number;
  extraKmCharge: number;
  extrasTotal: number;
  totalAmount: number;
  deposit: number;
  franchise: number;
}

/**
 * Compute the full price breakdown for a rental.
 * Throws a string error code (not Error object) for invalid inputs
 * so Fastify can map them to HTTP errors.
 */
export function computePrice(input: PriceInput): PriceBreakdown {
  const { category, days, estimatedKm, extrasTotal } = input;

  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    throw 'INVALID_DAY_RANGE';
  }
  if (!Number.isInteger(estimatedKm) || estimatedKm <= 0) {
    throw 'INVALID_KM';
  }

  const RATE_BY_DAYS: Record<number, number> = {
    1: category.price1Day,
    2: category.price2Day,
    3: category.price3Day,
    4: category.price4Day,
    5: category.price5Day,
    6: category.price6Day,
    7: category.price7Day,
  };

  const includedKm = days * KM_INCLUDED_PER_DAY;
  const extraKm = Math.max(0, estimatedKm - includedKm);
  const baseRate = RATE_BY_DAYS[days];
  const extraKmCharge = parseFloat((extraKm * category.extraKmRate).toFixed(2));
  const totalAmount = parseFloat((baseRate + extraKmCharge + extrasTotal).toFixed(2));

  return {
    days,
    includedKm,
    extraKm,
    baseRate,
    extraKmCharge,
    extrasTotal,
    totalAmount,
    deposit: category.deposit,
    franchise: category.franchise,
  };
}
