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
  office: { slug: string; city: string };
};

type Params = {
  officeSlug: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  category?: string;
};

export function useVehicles(params: Params | null) {
  const [vehicles, setVehicles] = useState<ApiVehicle[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params) return;

    const { officeSlug, startDate, endDate, category } = params;
    const qs = new URLSearchParams({ officeSlug, startDate, endDate });
    if (category) qs.set('category', category);

    setLoading(true);
    setError(null);

    api
      .get<ApiVehicle[]>(`/api/vehicles?${qs.toString()}`)
      .then(setVehicles)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.officeSlug, params?.startDate, params?.endDate, params?.category]);

  return { vehicles, loading, error };
}
