import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export type ApiOffice = {
  id: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
};

export function useOffices() {
  const [offices, setOffices] = useState<ApiOffice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ApiOffice[]>('/api/offices')
      .then(setOffices)
      .catch((err: Error) => setError(err.message));
  }, []);

  return { offices, error };
}
