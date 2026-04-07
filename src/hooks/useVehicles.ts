import { useMemo } from 'react';
import { vehicles as staticVehicles } from '../data/vehicles';

export type ApiVehicle = {
  id: string;
  model: string;
  brand: string;
  category: string;
  seats: number;
  dailyRate: string;
  imageUrl: string;
  fuelType: string;
  transmissionType: string;
  power: string;
  highlight: string;
  office: { slug: string; city: string };
};

type Params = {
  officeSlug: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  category?: string;
};

const API_TO_STATIC_CATEGORY: Record<string, string> = {
  TURISMOS: 'Turismos',
  FURGONETAS: 'Furgonetas',
  SUV_4X4: '4x4',
  AUTOCARAVANAS: 'Autocaravanas',
};

export function useVehicles(params: Params | null) {
  const vehicles = useMemo(() => {
    if (!params) return null;

    const staticCategory = params.category
      ? API_TO_STATIC_CATEGORY[params.category]
      : null;

    const filtered = staticCategory
      ? staticVehicles.filter((v) => v.category === staticCategory)
      : staticVehicles;

    return filtered.map((v) => ({
      id: v.id,
      model: v.name,
      brand: v.brand,
      category: v.category,
      seats: v.seats,
      dailyRate: String(v.dailyRate),
      imageUrl: v.image,
      fuelType: v.fuel,
      transmissionType: v.transmission,
      power: v.power,
      highlight: v.highlight,
      office: { slug: params.officeSlug, city: params.officeSlug },
    })) as ApiVehicle[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.officeSlug, params?.startDate, params?.endDate, params?.category]);

  return { vehicles, loading: false, error: null };
}
