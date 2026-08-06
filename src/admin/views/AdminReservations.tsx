'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminAuthError, adminApi } from '../api';
import { STATUS_LABELS, dateTime, errorLabel, euro } from '../format';
import type { ReservationListResponse, ReservationStatus } from '../types';
import styles from '../admin.module.css';

const STATUS_FILTERS: Array<{ value: ReservationStatus | ''; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'ACTIVE', label: 'En curso' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

export default function AdminReservations() {
  const router = useRouter();
  // En Next los search params son de solo lectura: para actualizarlos se
  // navega a la misma ruta con la query nueva (replace, sin scroll).
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() ?? '';

  const status = (searchParams?.get('status') ?? '') as ReservationStatus | '';
  const needsCheck = searchParams?.get('needsCheck') === 'true';
  const page = Math.max(1, Number(searchParams?.get('page') ?? '1') || 1);
  const search = searchParams?.get('q') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const [data, setData] = useState<ReservationListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(queryString);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `/admin/reservas?${qs}` : '/admin/reservas', { scroll: false });
    },
    [queryString, router],
  );

  useEffect(() => {
    let cancelled = false;
    // Reinicio del estado de carga al cambiar los filtros (patrón fetch-en-efecto).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    const query = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status) query.set('status', status);
    if (needsCheck) query.set('needsCheck', 'true');
    if (search) query.set('search', search);

    adminApi
      .get<ReservationListResponse>(`/api/admin/reservations?${query.toString()}`)
      .then((response) => {
        if (cancelled) return;

        // Página fuera de rango (p. ej. quedaban 25 pendientes en la página 2
        // y ya solo hay 15): volver a la primera en vez de mostrar un vacío.
        if (response.rows.length === 0 && response.total > 0 && page > 1) {
          updateParams({ page: null });
          return;
        }

        setData(response);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof AdminAuthError) {
          router.replace('/admin/login');
          return;
        }
        setError(errorLabel(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, needsCheck, page, search, router, updateParams]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Reservas</h1>
          <p className={styles.pageSubtitle}>
            {data ? `${data.total} solicitud${data.total === 1 ? '' : 'es'} en total.` : ' '}
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.chipRow} role="group" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={`${styles.chip} ${status === filter.value ? styles.chipActive : ''}`}
              onClick={() => updateParams({ status: filter.value || null, page: null })}
            >
              {filter.label}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.chip} ${needsCheck ? styles.chipActive : ''}`}
            onClick={() => updateParams({ needsCheck: needsCheck ? null : 'true', page: null })}
          >
            ⚠ Sin unidad
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            updateParams({ q: searchInput.trim() || null, page: null });
          }}
        >
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por código, nombre, email o teléfono…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Buscar reservas"
          />
        </form>
      </div>

      {error && <p className={styles.errorBox}>{error}</p>}

      {isLoading && !data ? (
        <p className={styles.loading}>Cargando reservas…</p>
      ) : data && data.rows.length === 0 ? (
        <div className={styles.tableWrap}>
          <p className={styles.empty}>No hay reservas que coincidan con el filtro.</p>
        </div>
      ) : data ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Gama</th>
                  <th>Recogida</th>
                  <th>Devolución</th>
                  <th>Estado</th>
                  <th className={styles.cellRight}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={styles.rowLink}
                    onClick={() => router.push(`/admin/reservas/${row.id}`)}
                  >
                    <td className={styles.cellMono}>{row.confirmationCode}</td>
                    <td>
                      <span className={styles.cellMain}>
                        {row.client.firstName} {row.client.lastName}
                      </span>
                      <span className={styles.cellSub}>{row.client.email}</span>
                    </td>
                    <td>
                      {row.tariffName}
                      {row.vehicle ? (
                        <span className={styles.cellSub}>
                          {row.vehicle.brand} {row.vehicle.name}
                        </span>
                      ) : (
                        <span className={styles.cellSub}>Sin unidad asignada</span>
                      )}
                    </td>
                    <td>
                      {dateTime(row.pickupAt)}
                      <span className={styles.cellSub}>{row.office.city}</span>
                    </td>
                    <td>
                      {dateTime(row.returnAt)}
                      <span className={styles.cellSub}>{row.returnOffice.city}</span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${row.status}`]}`}>
                        <span className={styles.badgeDot} />
                        {STATUS_LABELS[row.status]}
                      </span>
                      {row.needsAvailabilityCheck && (
                        <>
                          {' '}
                          <span className={`${styles.badge} ${styles.badgeWarn}`}>⚠</span>
                        </>
                      )}
                    </td>
                    <td className={`${styles.cellRight} ${styles.cellMain}`}>
                      {euro(row.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span>
              Página {data.page} de {totalPages}
            </span>
            <div className={styles.paginationButtons}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                ← Anterior
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
