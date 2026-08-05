import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminAuthError, adminApi } from '../api';
import { EMAIL_KIND_LABELS, EMAIL_STATUS_LABELS, dateTime, errorLabel } from '../format';
import type { EmailLogsResponse, EmailStatus } from '../types';
import styles from '../admin.module.css';

const STATUS_FILTERS: Array<{ value: EmailStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'SENT', label: 'Enviados' },
  { value: 'FAILED', label: 'Fallidos' },
  { value: 'SKIPPED', label: 'Omitidos' },
];

export default function AdminEmails() {
  const navigate = useNavigate();
  const [data, setData] = useState<EmailLogsResponse | null>(null);
  const [status, setStatus] = useState<EmailStatus | ''>('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const query = new URLSearchParams({ page: String(page), pageSize: '25' });
    if (status) query.set('status', status);

    adminApi
      .get<EmailLogsResponse>(`/api/admin/email-logs?${query.toString()}`)
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof AdminAuthError) {
          navigate('/admin/login', { replace: true });
          return;
        }
        setError(errorLabel(err));
      });

    return () => {
      cancelled = true;
    };
  }, [status, page, navigate]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Correo</h1>
          <p className={styles.pageSubtitle}>
            Registro de todos los envíos del sistema. Un envío «omitido» significa que faltaban las
            credenciales de Brevo en el servidor.
          </p>
        </div>
        <div className={styles.chipRow} role="group" aria-label="Filtrar por estado de envío">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={`${styles.chip} ${status === filter.value ? styles.chipActive : ''}`}
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className={styles.errorBox} style={{ marginBottom: 12 }}>{error}</p>}

      {!data ? (
        <p className={styles.loading}>Cargando registro…</p>
      ) : data.rows.length === 0 ? (
        <div className={styles.tableWrap}>
          <p className={styles.empty}>Sin envíos registrados con este filtro.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Destinatario</th>
                  <th>Asunto</th>
                  <th>Reserva</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{dateTime(row.createdAt)}</td>
                    <td>{EMAIL_KIND_LABELS[row.kind]}</td>
                    <td>{row.to}</td>
                    <td>
                      {row.subject}
                      {row.error && <span className={styles.cellSub}>{row.error}</span>}
                    </td>
                    <td>
                      {row.reservation ? (
                        <Link
                          to={`/admin/reservas/${row.reservation.id}`}
                          className={styles.cellMono}
                        >
                          {row.reservation.confirmationCode}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${row.status}`]}`}>
                        {EMAIL_STATUS_LABELS[row.status]}
                      </span>
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
