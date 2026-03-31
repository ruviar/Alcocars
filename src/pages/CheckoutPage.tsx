import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { gsap } from 'gsap';
import type { DateRange } from 'react-day-picker';
import { useLocation, useNavigate } from 'react-router-dom';
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

const extrasConfig: Array<{ key: ExtraKey; label: string }> = [
  { key: 'babySeat', label: 'Silla de bebe' },
  { key: 'snowChains', label: 'Cadenas de nieve' },
  { key: 'additionalDriver', label: 'Conductor adicional' },
];

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
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateRangeLabel(dateRange: DateRange | undefined) {
  if (!dateRange?.from) {
    return 'Fechas por confirmar';
  }

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
  const submitTimeoutRef = useRef<number | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData>(initialCustomerData);
  const [extras, setExtras] = useState<Record<ExtraKey, boolean>>(initialExtrasState);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const bookingState = state as CheckoutState | null;
  const pickupLocation = bookingState?.location;
  const selectedVehicleType = bookingState?.vehicleType;
  const selectedDateRange = bookingState?.dateRange;

  const hasSearchState = Boolean(
    bookingState && pickupLocation && selectedVehicleType && selectedDateRange?.from,
  );

  const formattedDates = useMemo(
    () => formatDateRangeLabel(selectedDateRange),
    [selectedDateRange],
  );

  useEffect(() => {
    if (!hasSearchState || !pageRef.current) {
      return;
    }

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

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current !== null) {
        window.clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setCustomerData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (isSubmitted) {
      setIsSubmitted(false);
    }
  };

  const handleExtraToggle = (key: ExtraKey) => {
    setExtras((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    if (isSubmitted) {
      setIsSubmitted(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setIsSubmitted(false);
    setIsLoading(true);

    if (submitTimeoutRef.current !== null) {
      window.clearTimeout(submitTimeoutRef.current);
    }

    submitTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      submitTimeoutRef.current = null;
    }, 1300);
  };

  if (!hasSearchState) {
    return (
      <main className={styles.emptyPage}>
        <section className={styles.emptyCard} aria-live="polite">
          <p className={styles.emptyKicker}>Reserva</p>
          <h1 className={styles.emptyTitle}>Empieza desde el buscador</h1>
          <p className={styles.emptyText}>
            No encontramos datos de fechas, ciudad o categoria. Vuelve al inicio y completa la busqueda para
            continuar con tu reserva.
          </p>
          <button type="button" className={styles.emptyButton} onClick={() => navigate('/')}>
            Ir al buscador
          </button>
        </section>
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
              <span className={styles.summaryLabel}>Categoria</span>
              <strong className={styles.summaryValue}>{selectedVehicleType}</strong>
            </div>
          </article>

          <article className={styles.extrasCard}>
            <h2 className={styles.extrasTitle}>Extras</h2>
            <p className={styles.extrasText}>Anade complementos para que el viaje se adapte a ti.</p>

            <div className={styles.extrasList}>
              {extrasConfig.map((extra) => (
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
              <span>Telefono</span>
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

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? (
                <span className={styles.loadingWrap}>
                  <span className={styles.spinner} aria-hidden="true" />
                  Cargando...
                </span>
              ) : (
                'SOLICITAR VEHÍCULO'
              )}
            </button>

            {isSubmitted ? (
              <p className={styles.success} role="status" aria-live="polite">
                Solicitud enviada. Te contactaremos en breve para confirmar la disponibilidad.
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
