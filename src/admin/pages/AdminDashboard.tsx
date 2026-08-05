import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminAuthError, adminApi } from '../api';
import { STATUS_LABELS, dateTime, errorLabel, euro } from '../format';
import type { AdminStats } from '../types';
import styles from '../admin.module.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    adminApi
      .get<AdminStats>('/api/admin/stats')
      .then((data) => {
        if (!cancelled) setStats(data);
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
  }, [navigate]);

  if (error) {
    return <p className={styles.errorBox}>{error}</p>;
  }

  if (!stats) {
    return <p className={styles.loading}>Cargando panel…</p>;
  }

  const cards = [
    { value: stats.totals.PENDING, label: 'Solicitudes pendientes', alert: stats.totals.PENDING > 0 },
    { value: stats.needsCheck, label: 'Por revisar disponibilidad', alert: stats.needsCheck > 0 },
    { value: stats.totals.CONFIRMED, label: 'Reservas confirmadas' },
    { value: stats.totals.ACTIVE, label: 'Alquileres en curso' },
    { value: stats.upcomingPickups7d, label: 'Recogidas próximos 7 días' },
    { value: stats.requestsLast30d, label: 'Solicitudes últimos 30 días' },
    { value: euro(stats.confirmedRevenue30d), label: 'Facturación estimada 30 días' },
    { value: stats.emailFailures7d, label: 'Emails fallidos (7 días)', alert: stats.emailFailures7d > 0 },
  ];

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Panel</h1>
          <p className={styles.pageSubtitle}>Estado del negocio de un vistazo.</p>
        </div>
        <Link to="/admin/reservas" className={`${styles.btn} ${styles.btnPrimary}`}>
          Ver reservas
        </Link>
      </div>

      <div className={styles.statsGrid}>
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${styles.statCard} ${card.alert ? styles.statCardAlert : ''}`}
          >
            <span className={styles.statValue}>{card.value}</span>
            <span className={styles.statLabel}>{card.label}</span>
          </div>
        ))}
      </div>

      <section className={styles.card} aria-label="Próximas recogidas">
        <h2 className={styles.sectionTitle}>Próximas recogidas</h2>

        {stats.nextPickups.length === 0 ? (
          <p className={styles.empty}>No hay recogidas programadas.</p>
        ) : (
          <div className={styles.tableWrap} style={{ border: 'none' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Recogida</th>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Gama</th>
                  <th>Oficina</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.nextPickups.map((pickup) => (
                  <tr
                    key={pickup.id}
                    className={styles.rowLink}
                    onClick={() => navigate(`/admin/reservas/${pickup.id}`)}
                  >
                    <td className={styles.cellMain}>{dateTime(pickup.pickupAt)}</td>
                    <td className={styles.cellMono}>{pickup.confirmationCode}</td>
                    <td>
                      {pickup.client.firstName} {pickup.client.lastName}
                    </td>
                    <td>{pickup.tariffName}</td>
                    <td>{pickup.office.city}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${pickup.status}`]}`}>
                        <span className={styles.badgeDot} />
                        {STATUS_LABELS[pickup.status]}
                      </span>
                      {pickup.needsAvailabilityCheck && (
                        <>
                          {' '}
                          <span className={`${styles.badge} ${styles.badgeWarn}`}>Sin unidad</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
