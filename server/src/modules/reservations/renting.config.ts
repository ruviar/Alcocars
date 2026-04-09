import type { VehicleCategory } from '@prisma/client';

type TariffByDays = Record<1 | 2 | 3 | 4 | 5 | 6 | 7, number>;

export const MAX_RENTAL_DAYS = 7;
export const INCLUDED_KM_PER_DAY = 200;

const BASE_EXTRA_KM_RATE = 0.18;

export const CATEGORY_ORDER: VehicleCategory[] = [
  'TURISMOS',
  'FURGONETAS',
  'SUV_4X4',
  'AUTOCARAVANAS',
];

const CATEGORY_TARIFFS: Record<VehicleCategory, TariffByDays> = {
  TURISMOS: {
    1: 49,
    2: 94,
    3: 138,
    4: 180,
    5: 220,
    6: 258,
    7: 294,
  },
  FURGONETAS: {
    1: 79,
    2: 152,
    3: 222,
    4: 289,
    5: 353,
    6: 414,
    7: 472,
  },
  SUV_4X4: {
    1: 95,
    2: 184,
    3: 270,
    4: 353,
    5: 433,
    6: 510,
    7: 584,
  },
  AUTOCARAVANAS: {
    1: 139,
    2: 270,
    3: 396,
    4: 517,
    5: 634,
    6: 747,
    7: 856,
  },
};

const CATEGORY_EXTRA_KM_MULTIPLIER: Record<VehicleCategory, number> = {
  TURISMOS: 1,
  FURGONETAS: 1.2,
  SUV_4X4: 1.35,
  AUTOCARAVANAS: 1.5,
};

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getCategoryTariff(category: VehicleCategory, totalDays: number): number | null {
  if (totalDays < 1 || totalDays > MAX_RENTAL_DAYS) {
    return null;
  }

  const dayKey = totalDays as keyof TariffByDays;
  return CATEGORY_TARIFFS[category][dayKey];
}

export function getIncludedKm(totalDays: number): number {
  return totalDays * INCLUDED_KM_PER_DAY;
}

export function getCategoryExtraKmMultiplier(category: VehicleCategory): number {
  return CATEGORY_EXTRA_KM_MULTIPLIER[category];
}

export function getExtraKmRate(category: VehicleCategory): number {
  return roundCurrency(BASE_EXTRA_KM_RATE * getCategoryExtraKmMultiplier(category));
}