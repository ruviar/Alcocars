'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuthError, adminApi } from '../api';
import { STATUS_LABELS, dateOnly, errorLabel } from '../format';
import type { AdminClientsResponse } from '../types';
import styles from '../admin.module.css';

export default function AdminClients() {
  const router = useRouter();
  const [data, setData] = useState<AdminClientsResponse | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const query = new URLSearchParams({ page: String(page), pageSize: '25' });
    if (search) query.set('search', search);

    adminApi
      .get<AdminClientsResponse>(`/api/admin/clients?${query.toString()}`)
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof AdminAuthError) {
          router.replace('/admin/login');
          return;
        }
        setError(errorLabel(err));
      });

    return () => {
      cancelled = true;
    };
  }, [search, page, router]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Clientes</h1>
          <p className={styles.pageSubtitle}>
            {data ? `${data.total} cliente${data.total === 1 ? '' : 's'} registrados.` : ' '}
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar por nombre, email o teléfono…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Buscar clientes"
          />
        </form>
      </div>

      {error && <p className={styles.errorBox} style={{ marginBottom: 12 }}>{error}</p>}

      {!data ? (
        <p className={styles.loading}>Cargando clientes…</p>
      ) : data.rows.length === 0 ? (
        <div className={styles.tableWrap}>
          <p className={styles.empty}>No hay clientes que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Alta</th>
                  <th>Reservas</th>
                  <th>Última reserva</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <span className={styles.cellMain}>
                        {client.firstName} {client.lastName}
                      </span>
                      <span className={styles.cellSub}>
                        <a href={`mailto:${client.email}`}>{client.email}</a>
                      </span>
                    </td>
                    <td>
                      <a href={`tel:${client.phone.replace(/\s+/g, '')}`}>{client.phone}</a>
                    </td>
                    <td>{dateOnly(client.createdAt)}</td>
                    <td>{client.reservationCount}</td>
                    <td>
                      {client.lastReservation ? (
                        <>
                          <span className={styles.cellMono}>
                            {client.lastReservation.confirmationCode}
                          </span>{' '}
                          <span
                            className={`${styles.badge} ${styles[`badge${client.lastReservation.status}`]}`}
                          >
                            {STATUS_LABELS[client.lastReservation.status]}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
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
                onClick={() => setPage((value) => value - 1)}
              >
                ← Anterior
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
