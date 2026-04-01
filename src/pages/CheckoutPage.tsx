import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { gsap } from 'gsap';
import type { DateRange } from 'react-day-picker';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useVehicles } from '../hooks/useVehicles';
import styles from './CheckoutPage.module.css';

type CheckoutState = {
  dateRange?: DateRange;
  location?: string;
  vehicleType?: string;
};

type ExtraKey = 'babySeat' | 'snowChains' | 'additionalDriver';

type CustomerData = {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
};

const EXTRAS_CONFIG: Array<{ key: ExtraKey; label: string }> = [
  { key: 'babySeat', label: 'Silla de bebé' },
  { key: 'snowChains', label: 'Cadenas de nieve' },
  { key: 'additionalDriver', label: 'Conductor adicional' },
];

const EXTRAS_API_MAP: Record<ExtraKey, 'BABY_SEAT' | 'SNOW_CHAINS' | 'ADDITIONAL_DRIVER'> = {
  babySeat: 'BABY_SEAT',
  snowChains: 'SNOW_CHAINS',
  additionalDriver: 'ADDITIONAL_DRIVER',
};

const CATEGORY_MAP: Record<string, string> = {
  Turismos: 'TURISMOS',
  Furgonetas: 'FURGONETAS',
  '4×4': 'SUV_4X4',
  Autocaravanas: 'AUTOCARAVANAS',
};

const initialCustomerData: CustomerData = {
  nombre: '',
  apellidos: '',
  telefono: '',
  email: '',
};

const initialExtrasState: Record<ExtraKey, boolean> = {
  babySeat: false,
  snowChains: false,
  additionalDriver: false,
};

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateRangeLabel(dateRange: DateRange | undefined) {
  if (!dateRange?.from) return 'Fechas por confirmar';
  const fromLabel = capitalizeFirst(format(dateRange.from, 'd MMM', { locale: es }));
  const toDate = dateRange.to ?? dateRange.from;
  const toLabel = capitalizeFirst(format(toDate, 'd MMM', { locale: es }));
  return `Del ${fromLabel} al ${toLabel}`;
}

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [customerData, setCustomerData] = useState<CustomerData>(initialCustomerData);
  const [extras, setExtras] = useState<Record<ExtraKey, boolean>>(initialExtrasState);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

  const bookingState = state as CheckoutState | null;
  const pickupLocation = bookingState?.location;
  const selectedVehicleType = bookingState?.vehicleType;
  const selectedDateRange = bookingState?.dateRange;

  const hasSearchState = Boolean(
    bookingState && pickupLocation && selectedVehicleType && selectedDateRange?.from,
  );

  const officeSlug = pickupLocation?.toLowerCase() ?? '';
  const apiCategory = selectedVehicleType ? CATEGORY_MAP[selectedVehicleType] : undefined;
  const startDateStr = selectedDateRange?.from ? format(selectedDateRange.from, 'yyyy-MM-dd') : '';
  const endDateStr = selectedDateRange?.to
    ? format(selectedDateRange.to, 'yyyy-MM-dd')
    : startDateStr;

  const vehicleParams = hasSearchState && startDateStr && endDateStr
    ? { officeSlug, startDate: startDateStr, endDate: endDateStr, category: apiCategory }
    : null;

  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useVehicles(vehicleParams);

  // Auto-select first vehicle when list loads
  useEffect(() => {
    if (vehicles && vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  const formattedDates = useMemo(
    () => formatDateRangeLabel(selectedDateRange),
    [selectedDateRange],
  );

  useEffect(() => {
    if (!hasSearchState || !pageRef.current) return;

    const ctx = gsap.context(() => {
      if (summaryRef.current) {
        gsap.fromTo(
          summaryRef.current,
          { x: -56, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' },
        );
      }
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { x: 56, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', delay: 0.08 },
        );
      }
    }, pageRef);

    return () => ctx.revert();
  }, [hasSearchState]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError(null);
  };

  const handleExtraToggle = (key: ExtraKey) => {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || !selectedVehicleId) return;

    setIsLoading(true);
    setSubmitError(null);

    const selectedExtras = (Object.keys(extras) as ExtraKey[])
      .filter((k) => extras[k])
      .map((k) => EXTRAS_API_MAP[k]);

    try {
      const result = await api.post<{ confirmationCode: string; reservationId: string }>(
        '/api/reservations/checkout',
        {
          vehicleId: selectedVehicleId,
          officeSlug,
          startDate: startDateStr,
          endDate: endDateStr,
          extras: selectedExtras,
          client: {
            firstName: customerData.nombre,
            lastName: customerData.apellidos,
            email: customerData.email,
            phone: customerData.telefono,
          },
        },
      );
      setConfirmationCode(result.confirmationCode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la reserva';
      setSubmitError(
        msg === 'VEHICLE_NOT_AVAILABLE'
          ? 'El vehículo ya no está disponible para estas fechas. Por favor, elige otro.'
          : msg,
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasSearchState) {
    return (
      <main className={styles.emptyPage}>
        <section className={styles.emptyCard} aria-live="polite">
          <p className={styles.emptyKicker}>Reserva</p>
          <h1 className={styles.emptyTitle}>Empieza desde el buscador</h1>
          <p className={styles.emptyText}>
            No encontramos datos de fechas, ciudad o categoría. Vuelve al inicio y completa la búsqueda para
            continuar con tu reserva.
          </p>
          <button type="button" className={styles.emptyButton} onClick={() => navigate('/')}>
            Ir al buscador
          </button>
        </section>
      </main>
    );
  }

  if (confirmationCode) {
    return (
      <main className={styles.page}>
        <div className={styles.layout}>
          <section className={styles.summaryColumn}>
            <p className={styles.kicker}>Reserva completada</p>
            <h1 className={styles.title}>LISTO</h1>
          </section>
          <section className={styles.formColumn}>
            <div className={styles.confirmationBox}>
              <p className={styles.confirmationKicker}>Código de confirmación</p>
              <p className={styles.confirmationCode}>{confirmationCode}</p>
              <p className={styles.confirmationText}>
                Te enviaremos los detalles de tu reserva por email. Presenta este código en la oficina al recoger el vehículo.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main ref={pageRef} className={styles.page}>
      <div className={styles.layout}>
        <section ref={summaryRef} className={styles.summaryColumn} aria-label="Resumen de tu viaje">
          <p className={styles.kicker}>Resumen de tu viaje</p>
          <h1 className={styles.title}>CHECKOUT</h1>

          <article className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Fechas</span>
              <strong className={styles.summaryValue}>{formattedDates}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Recogida</span>
              <strong className={styles.summaryValue}>{pickupLocation}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Categoría</span>
              <strong className={styles.summaryValue}>{selectedVehicleType}</strong>
            </div>
          </article>

          <article className={styles.vehiclesCard}>
            <h2 className={styles.extrasTitle}>Elige tu vehículo</h2>
            {vehiclesLoading && (
              <p className={styles.extrasText}>Buscando disponibilidad...</p>
            )}
            {vehiclesError && (
              <p className={styles.errorText}>Error al cargar vehículos: {vehiclesError}</p>
            )}
            {!vehiclesLoading && vehicles && vehicles.length === 0 && (
              <p className={styles.extrasText}>No hay vehículos disponibles para estas fechas.</p>
            )}
            {vehicles && vehicles.length > 0 && (
              <div className={styles.vehicleList}>
                {vehicles.map((v) => (
                  <label
                    key={v.id}
                    className={`${styles.vehicleItem} ${selectedVehicleId === v.id ? styles.vehicleItemSelected : ''}`}
                  >
                    <input
                      type="radio"
                      name="vehicleId"
                      value={v.id}
                      checked={selectedVehicleId === v.id}
                      onChange={() => setSelectedVehicleId(v.id)}
                      className={styles.vehicleRadio}
                    />
                    <span className={styles.vehicleName}>{v.brand} {v.model}</span>
                    <span className={styles.vehicleRate}>€{Number(v.dailyRate).toFixed(0)}/día</span>
                  </label>
                ))}
              </div>
            )}
          </article>

          <article className={styles.extrasCard}>
            <h2 className={styles.extrasTitle}>Extras</h2>
            <p className={styles.extrasText}>Añade complementos para que el viaje se adapte a ti.</p>
            <div className={styles.extrasList}>
              {EXTRAS_CONFIG.map((extra) => (
                <label key={extra.key} className={styles.extraItem}>
                  <span className={styles.extraLabel}>{extra.label}</span>
                  <input
                    className={styles.extraInput}
                    type="checkbox"
                    checked={extras[extra.key]}
                    onChange={() => handleExtraToggle(extra.key)}
                  />
                  <span className={styles.extraToggle} aria-hidden="true">
                    <span className={styles.extraThumb} />
                  </span>
                </label>
              ))}
            </div>
          </article>
        </section>

        <section ref={formRef} className={styles.formColumn} aria-label="Tus datos de reserva">
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>Tus datos</h2>

            <label className={styles.field}>
              <span>Nombre</span>
              <input
                type="text"
                name="nombre"
                value={customerData.nombre}
                onChange={handleInputChange}
                placeholder="Tu nombre"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Apellidos</span>
              <input
                type="text"
                name="apellidos"
                value={customerData.apellidos}
                onChange={handleInputChange}
                placeholder="Tus apellidos"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Teléfono</span>
              <input
                type="tel"
                name="telefono"
                value={customerData.telefono}
                onChange={handleInputChange}
                placeholder="+34 600 000 000"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={customerData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                required
              />
            </label>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || !selectedVehicleId || vehiclesLoading}
            >
              {isLoading ? (
                <span className={styles.loadingWrap}>
                  <span className={styles.spinner} aria-hidden="true" />
                  Procesando...
                </span>
              ) : (
                'CONFIRMAR RESERVA'
              )}
            </button>

            {submitError && (
              <p className={styles.errorText} role="alert" aria-live="assertive">
                {submitError}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
