'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AdminAuthError, adminApi } from '../api';
import {
  CATEGORY_LABELS,
  EMAIL_KIND_LABELS,
  EMAIL_STATUS_LABELS,
  STATUS_ACTIONS,
  STATUS_ACTION_LABELS,
  STATUS_LABELS,
  dateTime,
  errorLabel,
  euro,
} from '../format';
import type { AssignableVehicle, ReservationDetail, ReservationStatus } from '../types';
import styles from '../admin.module.css';

export default function AdminReservationDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [assignable, setAssignable] = useState<AssignableVehicle[] | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;

    let detail: ReservationDetail;
    try {
      detail = await adminApi.get<ReservationDetail>(`/api/admin/reservations/${id}`);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        router.replace('/admin/login');
        return;
      }
      // Solo se sustituye la página por el error si aún no hay nada cargado;
      // en un refresco fallido tras una acción, el detalle anterior sigue
      // siendo útil y el aviso va en la columna de acciones.
      setReservation((current) => {
        if (current) {
          setActionError('No se pudo refrescar la reserva. Recarga la página para ver el estado actual.');
        } else {
          setError(errorLabel(err));
        }
        return current;
      });
      return;
    }

    setReservation(detail);
    setNotesDraft(detail.notes ?? '');
    setError(null);

    // Solo pedimos unidades asignables cuando tiene sentido cambiarlas. Si
    // esta petición secundaria falla, no debe tumbar el detalle ya cargado.
    if (detail.status === 'PENDING' || detail.status === 'CONFIRMED') {
      try {
        const vehicles = await adminApi.get<AssignableVehicle[]>(
          `/api/admin/reservations/${id}/assignable-vehicles`,
        );
        setAssignable(vehicles);
      } catch (err) {
        if (err instanceof AdminAuthError) {
          router.replace('/admin/login');
          return;
        }
        setAssignable([]);
        setActionError('No se pudo cargar la lista de unidades asignables.');
      }
    } else {
      setAssignable(null);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (action: () => Promise<unknown>, okMessage: string) => {
    if (isWorking) return;
    setIsWorking(true);
    setActionError(null);
    setActionOk(null);

    try {
      await action();
      await load();
      setActionOk(okMessage);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        router.replace('/admin/login');
        return;
      }
      setActionError(errorLabel(err));
    } finally {
      setIsWorking(false);
    }
  };

  if (error) {
    return (
      <>
        <Link href="/admin/reservas" className={styles.backLink}>← Volver a reservas</Link>
        <p className={styles.errorBox}>{error}</p>
      </>
    );
  }

  if (!reservation) {
    return <p className={styles.loading}>Cargando reserva…</p>;
  }

  const transitions = STATUS_ACTIONS[reservation.status];
  const sameOffice = reservation.office.slug === reservation.returnOffice.slug;

  const statusButtonClass = (status: ReservationStatus): string => {
    if (status === 'CANCELLED') return `${styles.btn} ${styles.btnDanger}`;
    if (status === 'CONFIRMED' || status === 'ACTIVE' || status === 'COMPLETED') {
      return `${styles.btn} ${styles.btnSuccess}`;
    }
    return `${styles.btn} ${styles.btnGhost}`;
  };

  return (
    <>
      <Link href="/admin/reservas" className={styles.backLink}>← Volver a reservas</Link>

      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>
            <span className={styles.cellMono}>{reservation.confirmationCode}</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Recibida el {dateTime(reservation.createdAt)}
            {reservation.consentAt ? ` · privacidad aceptada ${dateTime(reservation.consentAt)}` : ''}
          </p>
        </div>
        <span className={`${styles.badge} ${styles[`badge${reservation.status}`]}`}>
          <span className={styles.badgeDot} />
          {STATUS_LABELS[reservation.status]}
        </span>
      </div>

      {reservation.needsAvailabilityCheck && (
        <p className={styles.alertBox} style={{ marginBottom: 16 }}>
          <strong>Revisar disponibilidad:</strong> esta solicitud entró sin ninguna unidad libre de
          su gama. Asigna un vehículo (o gestiona una alternativa con el cliente) antes de confirmar.
        </p>
      )}

      <div className={styles.detailGrid}>
        <div className={styles.detailColumn}>
          {/* Cliente */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Cliente</h2>
            <div className={styles.kv}>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Nombre</span>
                <span className={styles.kvValue}>
                  {reservation.client.firstName} {reservation.client.lastName}
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Email</span>
                <span className={styles.kvValue}>
                  <a href={`mailto:${reservation.client.email}`}>{reservation.client.email}</a>
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Teléfono</span>
                <span className={styles.kvValue}>
                  <a href={`tel:${reservation.client.phone.replace(/\s+/g, '')}`}>
                    {reservation.client.phone}
                  </a>
                </span>
              </div>
            </div>
          </section>

          {/* Alquiler */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Alquiler</h2>
            <div className={styles.kv}>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Gama</span>
                <span className={styles.kvValue}>{reservation.tariffName}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Recogida</span>
                <span className={styles.kvValue}>
                  {dateTime(reservation.pickupAt)} · {reservation.office.city}
                  <span className={styles.cellSub}>{reservation.office.address}</span>
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Devolución</span>
                <span className={styles.kvValue}>
                  {dateTime(reservation.returnAt)} ·{' '}
                  {sameOffice ? 'misma oficina' : reservation.returnOffice.city}
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Duración</span>
                <span className={styles.kvValue}>
                  {reservation.totalDays} día{reservation.totalDays === 1 ? '' : 's'}
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Kilometraje</span>
                <span className={styles.kvValue}>
                  {reservation.plannedKm.toLocaleString('es-ES')} km previstos ·{' '}
                  {reservation.includedKm.toLocaleString('es-ES')} incluidos
                  {reservation.extraKm > 0
                    ? ` · ${reservation.extraKm.toLocaleString('es-ES')} extra`
                    : ''}
                </span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>Unidad</span>
                <span className={styles.kvValue}>
                  {reservation.vehicle
                    ? `${reservation.vehicle.brand} ${reservation.vehicle.name} (${CATEGORY_LABELS[reservation.vehicle.category] ?? reservation.vehicle.category})`
                    : 'Sin asignar'}
                </span>
              </div>
            </div>
          </section>

          {/* Desglose económico */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Desglose económico</h2>
            <div className={styles.priceRow}>
              <span>Tarifa base ({reservation.totalDays} días)</span>
              <strong>{euro(reservation.baseTotal)}</strong>
            </div>
            <div className={styles.priceRow}>
              <span>
                Km extra ({reservation.extraKm} × {Number(reservation.extraKmRate).toFixed(2)} €)
              </span>
              <strong>{euro(reservation.extraKmSurcharge)}</strong>
            </div>
            {reservation.extras.map((extra) => (
              <div key={extra.id} className={styles.priceRow}>
                <span>
                  {extra.label}
                  {extra.quantity > 1 ? ` × ${extra.quantity}` : ''}
                </span>
                <strong>{euro(extra.totalPrice)}</strong>
              </div>
            ))}
            <div className={styles.priceTotal}>
              <span>Total estimado</span>
              <span>{euro(reservation.totalAmount)}</span>
            </div>
            <p className={styles.pageSubtitle} style={{ marginTop: 8 }}>
              Fianza {euro(reservation.deposit)} · Franquicia {euro(reservation.franchise)}
            </p>
          </section>

          {/* Notas */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Notas internas y observaciones</h2>
            <textarea
              className={styles.notesArea}
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="Observaciones del cliente y notas del equipo"
            />
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                disabled={isWorking || notesDraft === (reservation.notes ?? '')}
                onClick={() =>
                  runAction(
                    () =>
                      adminApi.patch(`/api/admin/reservations/${reservation.id}`, {
                        notes: notesDraft.trim() || null,
                      }),
                    'Notas guardadas.',
                  )
                }
              >
                Guardar notas
              </button>
            </div>
          </section>

          {/* Emails */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Correo de esta reserva</h2>
            {reservation.emails.length === 0 ? (
              <p className={styles.empty}>Sin envíos registrados.</p>
            ) : (
              <div className={styles.kv}>
                {reservation.emails.map((email) => (
                  <div key={email.id} className={styles.kvRow}>
                    <span className={styles.kvLabel}>{dateTime(email.createdAt)}</span>
                    <span className={styles.kvValue}>
                      <span className={`${styles.badge} ${styles[`badge${email.status}`]}`}>
                        {EMAIL_STATUS_LABELS[email.status]}
                      </span>{' '}
                      {EMAIL_KIND_LABELS[email.kind]} → {email.to}
                      {email.error && <span className={styles.cellSub}>{email.error}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Columna de acciones */}
        <div className={styles.detailColumn}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Estado</h2>

            {actionError && <p className={styles.errorBox} style={{ marginBottom: 10 }}>{actionError}</p>}
            {actionOk && <p className={styles.okBox} style={{ marginBottom: 10 }}>{actionOk}</p>}

            {transitions.length === 0 ? (
              <p className={styles.pageSubtitle}>
                Estado final: no admite más cambios.
              </p>
            ) : (
              <div className={styles.actionStack}>
                {transitions.map((next) => (
                  <button
                    key={next}
                    type="button"
                    className={statusButtonClass(next)}
                    disabled={isWorking}
                    onClick={() =>
                      runAction(
                        () =>
                          adminApi.patch(`/api/admin/reservations/${reservation.id}/status`, {
                            status: next,
                          }),
                        `Estado actualizado a «${STATUS_LABELS[next]}».`,
                      )
                    }
                  >
                    {STATUS_ACTION_LABELS[next]}
                  </button>
                ))}
              </div>
            )}
          </section>

          {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Asignar unidad</h2>

              {assignable === null ? (
                <p className={styles.pageSubtitle}>Cargando unidades…</p>
              ) : assignable.length === 0 && !reservation.vehicle ? (
                <p className={styles.alertBox}>
                  No hay unidades libres de esta gama en {reservation.office.city} para esas fechas.
                  Contacta con el cliente para ofrecer una alternativa.
                </p>
              ) : (
                <div className={styles.actionStack}>
                  <select
                    className={styles.select}
                    value={selectedVehicleId}
                    onChange={(event) => setSelectedVehicleId(event.target.value)}
                    aria-label="Unidad a asignar"
                  >
                    <option value="">Selecciona una unidad…</option>
                    {assignable.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.name} · {vehicle.seats} plazas · {vehicle.transmission}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={isWorking || !selectedVehicleId}
                    onClick={() =>
                      runAction(
                        () =>
                          adminApi.patch(`/api/admin/reservations/${reservation.id}`, {
                            vehicleId: selectedVehicleId,
                          }),
                        'Unidad asignada.',
                      )
                    }
                  >
                    Asignar unidad
                  </button>

                  {reservation.vehicle && reservation.status === 'PENDING' && (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost}`}
                      disabled={isWorking}
                      onClick={() =>
                        runAction(
                          () =>
                            adminApi.patch(`/api/admin/reservations/${reservation.id}`, {
                              vehicleId: null,
                            }),
                          'Unidad desasignada.',
                        )
                      }
                    >
                      Quitar unidad actual
                    </button>
                  )}

                  {reservation.vehicle && reservation.status === 'CONFIRMED' && (
                    <p className={styles.pageSubtitle}>
                      En una reserva confirmada la unidad solo puede sustituirse por otra, no
                      quedarse vacía. Para desasignar, devuélvela antes a pendiente.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Contacto rápido</h2>
            <div className={styles.actionStack}>
              <a
                className={`${styles.btn} ${styles.btnGhost}`}
                href={`mailto:${reservation.client.email}?subject=${encodeURIComponent(
                  `Tu reserva en Alcocars (${reservation.confirmationCode})`,
                )}`}
              >
                Escribir email al cliente
              </a>
              <a
                className={`${styles.btn} ${styles.btnGhost}`}
                href={`tel:${reservation.client.phone.replace(/\s+/g, '')}`}
              >
                Llamar al cliente
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
