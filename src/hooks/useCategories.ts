import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Category } from '../lib/categories';

export function useCategories() {
  const [data, setData] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    api
      .get<Category[]>('/api/categories')
      .then((categories) => {
        if (cancelled) return;
        setData(categories);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData([]);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las categorías');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
