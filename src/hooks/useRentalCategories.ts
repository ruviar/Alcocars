import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export type ApiRentalCategoryCode = 'TURISMOS' | 'FURGONETAS' | 'SUV_4X4' | 'AUTOCARAVANAS';

export type ApiRentalCategory = {
  category: ApiRentalCategoryCode;
  availableUnits: number;
  powerRange: string;
  seatsRange: string;
  safeBabySeatMax: number;
  pricing: {
    totalDays: number;
    basePrice: number;
    includedKm: number;
    extraKmRate: number;
    extraKmMultiplier: number;
  };
};

type Params = {
  officeSlug: string;
  startDate: string;
  endDate: string;
};

export function useRentalCategories(params: Params | null) {
  const [categories, setCategories] = useState<ApiRentalCategory[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!params) {
      setCategories(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const query = new URLSearchParams({
      officeSlug: params.officeSlug,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    setIsLoading(true);
    setError(null);

    api
      .get<ApiRentalCategory[]>(`/api/reservations/categories?${query.toString()}`)
      .then((rows) => {
        if (cancelled) return;
        setCategories(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCategories([]);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las categorías');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params?.officeSlug, params?.startDate, params?.endDate]);

  return { categories, isLoading, error };
}
