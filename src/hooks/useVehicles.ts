import { useEffect, useState } from 'react';
import { api } from '../lib/api';

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

type RawVehicle = {
  id: string;
  name: string;
  brand: string;
  category: string;
  seats: number;
  dailyRate: string | number;
  imageUrl: string;
  fuel: string;
  transmission: string;
  power: string;
  highlight: string;
  office: { slug: string; city: string };
};

export function useVehicles(params: Params | null) {
  const [vehicles, setVehicles] = useState<ApiVehicle[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!params) {
      setVehicles(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const query = new URLSearchParams({
      officeSlug: params.officeSlug,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    if (params.category) {
      query.set('category', params.category);
    }

    setIsLoading(true);
    setError(null);

    api
      .get<RawVehicle[]>(`/api/vehicles?${query.toString()}`)
      .then((rows) => {
        if (cancelled) return;

        const mapped: ApiVehicle[] = rows.map((v) => ({
          id: v.id,
          model: v.name,
          brand: v.brand,
          category: v.category,
          seats: v.seats,
          dailyRate: String(v.dailyRate),
          imageUrl: v.imageUrl,
          fuelType: v.fuel,
          transmissionType: v.transmission,
          power: v.power,
          highlight: v.highlight,
          office: v.office,
        }));

        setVehicles(mapped);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVehicles([]);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los vehículos');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params?.officeSlug, params?.startDate, params?.endDate, params?.category]);

  return { vehicles, isLoading, loading: isLoading, error };
}
