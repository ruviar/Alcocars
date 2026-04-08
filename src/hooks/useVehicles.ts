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

const STATIC_OFFICE_BY_VEHICLE_ID: Record<string, string> = {
  'seat-ibiza-eco': 'zaragoza',
  'seat-leon-tdi': 'zaragoza',
  'ford-custom-6p': 'zaragoza',
  'furgoneta-carga-3m3': 'zaragoza',
  'furgoneta-carga-12m3': 'zaragoza',
  'toyota-hilux-pickup': 'zaragoza',
  'vw-passat-business': 'zaragoza',
  'renault-clio-tudela': 'tudela',
  'furgoneta-pasajeros-9p': 'tudela',
  'furgoneta-carga-7m3': 'tudela',
  'autocaravana-tudela': 'tudela',
  'dacia-sandero-soria': 'soria',
  'suzuki-jimny-4x4': 'soria',
  'furgoneta-caja-abierta': 'soria',
  'toyota-land-cruiser-largo': 'soria',
};

const OFFICE_CITY_BY_SLUG: Record<string, string> = {
  zaragoza: 'Zaragoza',
  tudela: 'Tudela',
  soria: 'Soria',
};

export function useVehicles(params: Params | null) {
  const vehicles = useMemo(() => {
    if (!params) return null;

    const staticCategory = params.category
      ? API_TO_STATIC_CATEGORY[params.category]
      : null;

    const byOffice = staticVehicles.filter(
      (vehicle) => STATIC_OFFICE_BY_VEHICLE_ID[vehicle.id] === params.officeSlug,
    );

    const filtered = staticCategory
      ? byOffice.filter((v) => v.category === staticCategory)
      : byOffice;

    const officeCity = OFFICE_CITY_BY_SLUG[params.officeSlug] ?? params.officeSlug;

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
      office: { slug: params.officeSlug, city: officeCity },
    })) as ApiVehicle[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.officeSlug, params?.startDate, params?.endDate, params?.category]);

  return { vehicles, loading: false, error: null };
}
