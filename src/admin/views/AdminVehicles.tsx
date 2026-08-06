'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuthError, adminApi } from '../api';
import { CATEGORY_LABELS, errorLabel } from '../format';
import type { AdminVehicle } from '../types';
import styles from '../admin.module.css';

const OFFICE_FILTERS = [
  { value: '', label: 'Todas las oficinas' },
  { value: 'zaragoza', label: 'Zaragoza' },
  { value: 'tudela', label: 'Tudela' },
  { value: 'agreda', label: 'Ágreda' },
];

export default function AdminVehicles() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<AdminVehicle[] | null>(null);
  const [officeSlug, setOfficeSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const query = officeSlug ? `?officeSlug=${officeSlug}` : '';
    adminApi
      .get<AdminVehicle[]>(`/api/admin/vehicles${query}`)
      .then((rows) => {
        if (!cancelled) setVehicles(rows);
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
  }, [officeSlug, router]);

  const toggleVehicle = async (vehicle: AdminVehicle) => {
    if (togglingId) return;
    setTogglingId(vehicle.id);
    setError(null);

    try {
      const updated = await adminApi.patch<{ id: string; isActive: boolean }>(
        `/api/admin/vehicles/${vehicle.id}`,
        { isActive: !vehicle.isActive },
      );
      setVehicles((prev) =>
        prev
          ? prev.map((row) => (row.id === updated.id ? { ...row, isActive: updated.isActive } : row))
          : prev,
      );
    } catch (err) {
      if (err instanceof AdminAuthError) {
        router.replace('/admin/login');
        return;
      }
      setError(errorLabel(err));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Vehículos</h1>
          <p className={styles.pageSubtitle}>
            Una unidad desactivada deja de ofrecerse en las nuevas solicitudes (por avería, venta o
            mantenimiento); las reservas ya creadas no se tocan.
          </p>
        </div>
        <select
          className={styles.select}
          value={officeSlug}
          onChange={(event) => setOfficeSlug(event.target.value)}
          aria-label="Filtrar por oficina"
        >
          {OFFICE_FILTERS.map((office) => (
            <option key={office.value} value={office.value}>
              {office.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={styles.errorBox} style={{ marginBottom: 12 }}>{error}</p>}

      {!vehicles ? (
        <p className={styles.loading}>Cargando flota…</p>
      ) : vehicles.length === 0 ? (
        <div className={styles.tableWrap}>
          <p className={styles.empty}>No hay vehículos en esta oficina.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Categoría</th>
                <th>Oficina</th>
                <th>Plazas</th>
                <th>Reservas abiertas</th>
                <th>Disponible</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>
                    <span className={styles.cellMain}>
                      {vehicle.brand} {vehicle.name}
                    </span>
                    <span className={styles.cellSub}>
                      {vehicle.fuel} · {vehicle.transmission}
                    </span>
                  </td>
                  <td>{CATEGORY_LABELS[vehicle.category] ?? vehicle.category}</td>
                  <td>{vehicle.office.city}</td>
                  <td>{vehicle.seats}</td>
                  <td>{vehicle.openReservations}</td>
                  <td>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={vehicle.isActive}
                      aria-label={`${vehicle.isActive ? 'Desactivar' : 'Activar'} ${vehicle.brand} ${vehicle.name}`}
                      className={`${styles.switch} ${vehicle.isActive ? styles.switchOn : ''}`}
                      disabled={togglingId === vehicle.id}
                      onClick={() => toggleVehicle(vehicle)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
