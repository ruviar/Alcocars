import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export type ApiOffice = {
  id: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  lat: number;
  lng: number;
  description: string;
};

export function useOffices() {
  const [offices, setOffices] = useState<ApiOffice[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    api
      .get<ApiOffice[]>('/api/offices')
      .then((data) => {
        if (cancelled) return;
        setOffices(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setOffices([]);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las sedes');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { offices, isLoading, error };
}
