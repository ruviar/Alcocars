import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { addDays, differenceInCalendarDays, format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { gsap } from 'gsap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import {
  CATEGORY_GROUPS,
  CATEGORY_GROUP_LABELS,
  groupCategories,
  type Category,
} from '../lib/categories';
import { api } from '../lib/api';
import { computePrice, type CategoryRates } from '../lib/pricing';
import styles from './CheckoutPage.module.css';

type CheckoutState = {
  dateRange?: {
    from?: Date | string;
    to?: Date | string;
  };
  location?: string;
  categoryId?: string;
  vehicleType?: string;
  estimatedKm?: number;
};

type ToggleExtraKey = 'snowChains' | 'additionalDriver';
type CheckoutExtraKey = 'BABY_SEAT' | 'SNOW_CHAINS' | 'ADDITIONAL_DRIVER';

type CustomerData = {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
};

const LOCATIONS = ['Zaragoza', 'Tudela', 'Soria'] as const;

const EXTRAS_CONFIG: Array<{
  key: ToggleExtraKey;
  apiKey: Exclude<CheckoutExtraKey, 'BABY_SEAT'>;
  label: string;
  pricePerDay: number;
}> = [
  { key: 'snowChains', apiKey: 'SNOW_CHAINS', label: 'Cadenas de nieve', pricePerDay: 5 },
  { key: 'additionalDriver', apiKey: 'ADDITIONAL_DRIVER', label: 'Conductor adicional', pricePerDay: 10 },
];

const BABY_SEAT_RATE_PER_DAY = 8;

const initialCustomerData: CustomerData = {
  nombre: '',
  apellidos: '',
  telefono: '',
  email: '',
};

const initialExtrasState: Record<ToggleExtraKey, boolean> = {
  snowChains: false,
  additionalDriver: false,
};

function toValidDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function parseDateInput(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function toInputDate(value: Date): string {
  return format(value, 'yyyy-MM-dd');
}

function toOfficeSlug(value: string): string {
  return value.toLowerCase().trim();
}

function toEuros(value: number): string {
  return `${value.toFixed(2)} €`;
}

function toCategoryRates(category: Category): CategoryRates {
  return {
    price1Day: category.price1Day,
    price2Day: category.price2Day,
    price3Day: category.price3Day,
    price4Day: category.price4Day,
    price5Day: category.price5Day,
    price6Day: category.price6Day,
    price7Day: category.price7Day,
    extraKmRate: category.extraKmRate,
    deposit: category.deposit,
    franchise: category.franchise,
  };
}

function formatDateRangeLabel(startDate: Date, endDate: Date, totalDays: number): string {
  const startLabel = format(startDate, 'd MMM', { locale: es });
  const endLabel = format(endDate, 'd MMM', { locale: es });
  const suffix = totalDays === 1 ? 'día' : 'días';

  return `Del ${startLabel} al ${endLabel} (${totalDays} ${suffix})`;
}

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLElement>(null);

  const bookingState = state as CheckoutState | null;
  const hasSearchState = Boolean(bookingState);

  const today = startOfToday();
  const initialStartDate = toValidDate(bookingState?.dateRange?.from) ?? today;
  const initialEndDateCandidate = toValidDate(bookingState?.dateRange?.to);
  const initialEndDate =
    initialEndDateCandidate && initialEndDateCandidate > initialStartDate
      ? initialEndDateCandidate
      : addDays(initialStartDate, 1);

  const initialLocation =
    bookingState?.location && LOCATIONS.some((location) => location === bookingState.location)
      ? bookingState.location
      : 'Zaragoza';

  const initialEstimatedKm =
    Number.isInteger(bookingState?.estimatedKm) && (bookingState?.estimatedKm ?? 0) > 0
      ? (bookingState?.estimatedKm as number)
      : 200;

  const [pickupLocation, setPickupLocation] = useState<string>(initialLocation);
  const [startDate, setStartDate] = useState<Date>(initialStartDate);
  const [endDate, setEndDate] = useState<Date>(initialEndDate);
  const [categoryId, setCategoryId] = useState<string>(bookingState?.categoryId ?? '');
  const [estimatedKm, setEstimatedKm] = useState<number>(initialEstimatedKm);
  const [customerData, setCustomerData] = useState<CustomerData>(initialCustomerData);
  const [extras, setExtras] = useState<Record<ToggleExtraKey, boolean>>(initialExtrasState);
  const [babySeatQty, setBabySeatQty] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [confirmationTotal, setConfirmationTotal] = useState<number | null>(null);

  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const groupedCategories = useMemo(
    () => (categories ? groupCategories(categories) : null),
    [categories],
  );

  const selectedCategory = useMemo(
    () => categories?.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId],
  );

  useEffect(() => {
    if (categoryId || !categories || !bookingState?.vehicleType) {
      return;
    }

    const legacyTypeToGroup: Record<string, (typeof CATEGORY_GROUPS)[number]> = {
      Turismos: 'COCHE',
      Furgonetas: 'FURGONETA_CARGA',
      '4×4': 'TODOTERRENO',
      '4x4': 'TODOTERRENO',
      Autocaravanas: 'TODOTERRENO',
    };

    const targetGroup = legacyTypeToGroup[bookingState.vehicleType];
    if (!targetGroup) {
      return;
    }

    const fallbackCategory = categories.find((category) => category.group === targetGroup);
    if (fallbackCategory) {
      setCategoryId(fallbackCategory.id);
    }
  }, [bookingState?.vehicleType, categories, categoryId]);

  const totalDays = useMemo(
    () => differenceInCalendarDays(endDate, startDate),
    [startDate, endDate],
  );

  const normalizedEstimatedKm = useMemo(() => {
    if (!Number.isFinite(estimatedKm)) return 0;
    return Math.max(0, Math.floor(estimatedKm));
  }, [estimatedKm]);

  const extrasTotal = useMemo(() => {
    if (totalDays < 1) return 0;

    const toggledExtrasPerDay = EXTRAS_CONFIG.reduce((sum, extra) => {
      return sum + (extras[extra.key] ? extra.pricePerDay : 0);
    }, 0);

    const totalPerDay = toggledExtrasPerDay + babySeatQty * BABY_SEAT_RATE_PER_DAY;
    return totalPerDay * totalDays;
  }, [babySeatQty, extras, totalDays]);

  const priceBreakdown = useMemo(() => {
    if (!selectedCategory) return null;
    if (totalDays < 1) return null;
    if (normalizedEstimatedKm <= 0) return null;

    try {
      return computePrice({
        category: toCategoryRates(selectedCategory),
        days: totalDays,
        estimatedKm: normalizedEstimatedKm,
        extrasTotal,
      });
    } catch {
      return null;
    }
  }, [selectedCategory, totalDays, normalizedEstimatedKm, extrasTotal]);

  const formattedDates = useMemo(
    () => formatDateRangeLabel(startDate, endDate, Math.max(totalDays, 0)),
    [startDate, endDate, totalDays],
  );

  useEffect(() => {
    if (!hasSearchState || !pageRef.current) return;

    const ctx = gsap.context(() => {
      if (summaryRef.current) {
        gsap.fromTo(
          summaryRef.current,
          { y: 28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.75, ease: 'power3.out' },
        );
      }

      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { y: 28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.75, ease: 'power3.out', delay: 0.12 },
        );
      }
    }, pageRef);

    return () => ctx.revert();
  }, [hasSearchState]);

  const handleCustomerInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError(null);
  };

  const handleExtraToggle = (key: ToggleExtraKey) => {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDateInput(event.target.value);
    if (!parsed) return;

    setStartDate(parsed);

    if (differenceInCalendarDays(endDate, parsed) < 1) {
      setEndDate(addDays(parsed, 1));
    }

    setSubmitError(null);
  };

  const handleEndDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseDateInput(event.target.value);
    if (!parsed) return;

    setEndDate(parsed);
    setSubmitError(null);
  };

  const handleEstimatedKmChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      setEstimatedKm(0);
      return;
    }

    setEstimatedKm(Math.max(0, Math.floor(Number(value))));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    if (!categoryId) {
      setSubmitError('Selecciona una categoría para continuar.');
      return;
    }

    if (totalDays < 1) {
      setSubmitError('La fecha de devolución debe ser posterior a la de recogida.');
      return;
    }

    if (totalDays > 7) {
      setSubmitError('La tarifa online está disponible para reservas de 1 a 7 días.');
      return;
    }

    if (!Number.isInteger(normalizedEstimatedKm) || normalizedEstimatedKm <= 0) {
      setSubmitError('Introduce kilómetros previstos válidos (entero mayor que 0).');
      return;
    }

    const selectedExtras: Array<{ key: CheckoutExtraKey; quantity: number }> = [];

    if (babySeatQty > 0) {
      selectedExtras.push({ key: 'BABY_SEAT', quantity: babySeatQty });
    }

    EXTRAS_CONFIG.forEach((extra) => {
      if (extras[extra.key]) {
        selectedExtras.push({ key: extra.apiKey, quantity: 1 });
      }
    });

    setIsLoading(true);
    setSubmitError(null);

    try {
      const result = await api.post<{ confirmationCode: string; reservationId: string; totalAmount: number }>(
        '/api/reservations/checkout',
        {
          categoryId,
          officeSlug: toOfficeSlug(pickupLocation),
          startDate: toInputDate(startDate),
          endDate: toInputDate(endDate),
          estimatedKm: normalizedEstimatedKm,
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
      setConfirmationTotal(result.totalAmount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la reserva';

      if (msg === 'CATEGORY_NOT_FOUND') {
        setSubmitError('La categoría seleccionada ya no está disponible.');
      } else if (msg === 'OFFICE_NOT_FOUND') {
        setSubmitError('No hemos encontrado la oficina seleccionada.');
      } else if (msg === 'INVALID_DATE_RANGE' || msg === 'INVALID_DAY_RANGE') {
        setSubmitError('Revisa el rango de fechas. Solo se admiten reservas de 1 a 7 días.');
      } else {
        setSubmitError(msg);
      }
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
              {confirmationTotal != null ? (
                <p className={styles.confirmationText}>Importe confirmado: {toEuros(confirmationTotal)}</p>
              ) : null}
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
              <span className={styles.summaryLabel}>Recogida</span>
              <span className={styles.summaryValue}>{pickupLocation}</span>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Fechas</span>
              <span className={styles.summaryValue}>{formattedDates}</span>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Categoría</span>
              <span className={styles.summaryValue}>{selectedCategory?.name ?? 'Selecciona categoría'}</span>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Km previstos</span>
              <span className={styles.summaryValue}>{normalizedEstimatedKm} km</span>
            </div>
          </article>

          <article className={styles.extrasCard}>
            <h2 className={styles.extrasTitle}>Desglose de precio</h2>
            {categoriesLoading && <p className={styles.extrasText}>Cargando tarifas de categoría...</p>}
            {categoriesError && !categoriesLoading && (
              <p className={styles.errorText}>No se pudieron cargar las tarifas: {categoriesError}</p>
            )}

            {!categoriesLoading && !categoriesError && !selectedCategory && (
              <p className={styles.extrasText}>Selecciona una categoría para ver el precio en vivo.</p>
            )}

            {!categoriesLoading && !categoriesError && selectedCategory && !priceBreakdown && (
              <p className={styles.extrasText}>Completa fechas y kilómetros para calcular el precio.</p>
            )}

            {priceBreakdown && (
              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>Tarifa base ({priceBreakdown.days} días)</span>
                  <strong>{toEuros(priceBreakdown.baseRate)}</strong>
                </div>
                <div className={styles.priceRow}>
                  <span>Km incluidos</span>
                  <strong>{priceBreakdown.includedKm} km</strong>
                </div>
                <div className={styles.priceRow}>
                  <span>Km extra</span>
                  <strong>{priceBreakdown.extraKm} km</strong>
                </div>
                <div className={styles.priceRow}>
                  <span>Sobrecoste km extra</span>
                  <strong>{toEuros(priceBreakdown.extraKmCharge)}</strong>
                </div>
                <div className={styles.priceRow}>
                  <span>Extras</span>
                  <strong>{toEuros(priceBreakdown.extrasTotal)}</strong>
                </div>
                <div className={`${styles.priceRow} ${styles.priceTotal}`}>
                  <span>TOTAL</span>
                  <strong>{toEuros(priceBreakdown.totalAmount)}</strong>
                </div>

                <div className={styles.depositNotice}>
                  <p><strong>Fianza:</strong> {toEuros(priceBreakdown.deposit)}</p>
                  <p><strong>Franquicia:</strong> {toEuros(priceBreakdown.franchise)}</p>
                </div>
              </div>
            )}
          </article>

          <article className={styles.extrasCard}>
            <h2 className={styles.extrasTitle}>Extras</h2>
            <p className={styles.extrasText}>Añade complementos para que el viaje se adapte a ti.</p>
            <div className={styles.extrasList}>
              <div className={styles.extraItem}>
                <div className={styles.babySeatLeft}>
                  <span className={styles.extraLabel}>Silla de bebé</span>
                  <span className={styles.babySeatHint}>Hasta 6 unidades (8 €/día por unidad)</span>
                </div>
                <div className={styles.babySeatCounter} aria-live="polite">
                  <button
                    type="button"
                    className={styles.babySeatBtn}
                    onClick={() => setBabySeatQty((prev) => Math.max(prev - 1, 0))}
                    disabled={babySeatQty === 0}
                    aria-label="Reducir sillas de bebé"
                  >
                    -
                  </button>
                  <span className={styles.babySeatQtyNum}>{babySeatQty}</span>
                  <button
                    type="button"
                    className={styles.babySeatBtn}
                    onClick={() => setBabySeatQty((prev) => Math.min(prev + 1, 6))}
                    disabled={babySeatQty >= 6}
                    aria-label="Aumentar sillas de bebé"
                  >
                    +
                  </button>
                </div>
              </div>

              {EXTRAS_CONFIG.map((extra) => (
                <label key={extra.key} className={styles.extraItem}>
                  <span className={styles.extraLabel}>
                    {extra.label} ({extra.pricePerDay} €/día)
                  </span>
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
            <h2 className={styles.formTitle}>Configura tu alquiler</h2>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Oficina</span>
                <select value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)}>
                  {LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>Categoría</span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  disabled={categoriesLoading}
                  required
                >
                  <option value="" disabled>
                    {categoriesLoading ? 'Cargando categorías...' : 'Selecciona categoría'}
                  </option>
                  {groupedCategories
                    ? CATEGORY_GROUPS.map((group) => {
                        const rows = groupedCategories[group];
                        if (!rows?.length) return null;

                        return (
                          <optgroup key={group} label={CATEGORY_GROUP_LABELS[group]}>
                            {rows.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })
                    : null}
                </select>
              </label>

              <label className={styles.field}>
                <span>Recogida</span>
                <input
                  type="date"
                  value={toInputDate(startDate)}
                  min={toInputDate(today)}
                  onChange={handleStartDateChange}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Devolución</span>
                <input
                  type="date"
                  value={toInputDate(endDate)}
                  min={toInputDate(addDays(startDate, 1))}
                  onChange={handleEndDateChange}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Km previstos</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={normalizedEstimatedKm}
                  onChange={handleEstimatedKmChange}
                  required
                />
              </label>
            </div>

            <p className={styles.hintText}>La tarifa online aplica para periodos de 1 a 7 días.</p>

            <h2 className={styles.formTitle}>Tus datos</h2>

            <label className={styles.field}>
              <span>Nombre</span>
              <input
                type="text"
                name="nombre"
                value={customerData.nombre}
                onChange={handleCustomerInputChange}
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
                onChange={handleCustomerInputChange}
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
                onChange={handleCustomerInputChange}
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
                onChange={handleCustomerInputChange}
                placeholder="tu@email.com"
                required
              />
            </label>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={
                isLoading ||
                categoriesLoading ||
                !categoryId ||
                totalDays < 1 ||
                totalDays > 7 ||
                normalizedEstimatedKm <= 0
              }
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
