import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { addDays, format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { gsap } from 'gsap';
import { DayPicker, type ClassNames, type DateRange } from 'react-day-picker';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  useRentalCategories,
  type ApiRentalCategory,
  type ApiRentalCategoryCode,
} from '../hooks/useRentalCategories';
import styles from './CheckoutPage.module.css';

type CheckoutState = {
  dateRange?: DateRange;
  location?: string;
  rentalCategory?: string;
  vehicleType?: string;
};

type ToggleExtraKey = 'snowChains' | 'additionalDriver';
type CheckoutExtraKey = 'BABY_SEAT' | 'SNOW_CHAINS' | 'ADDITIONAL_DRIVER';
type RentalCategoryOption = 'Cualquier gama' | 'Turismos' | 'Furgonetas' | '4×4' | 'Autocaravanas';

type CustomerData = {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
};

const EXTRAS_CONFIG: Array<{ key: ToggleExtraKey; label: string }> = [
  { key: 'snowChains', label: 'Cadenas de nieve' },
  { key: 'additionalDriver', label: 'Conductor adicional' },
];

const EXTRAS_API_MAP: Record<ToggleExtraKey, CheckoutExtraKey> = {
  snowChains: 'SNOW_CHAINS',
  additionalDriver: 'ADDITIONAL_DRIVER',
};

const EXTRA_PRICE_PER_DAY = {
  BABY_SEAT: 8,
  SNOW_CHAINS: 5,
  ADDITIONAL_DRIVER: 10,
} as const;

const LOCATIONS = ['Zaragoza', 'Tudela', 'Soria'] as const;
const RENTAL_CATEGORIES: readonly RentalCategoryOption[] = [
  'Cualquier gama',
  'Turismos',
  'Furgonetas',
  '4×4',
  'Autocaravanas',
];

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

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isRentalCategoryOption(value: string): value is RentalCategoryOption {
  return RENTAL_CATEGORIES.includes(value as RentalCategoryOption);
}

function categoryOptionToApi(option: string): ApiRentalCategoryCode | null {
  switch (option) {
    case 'Turismos':
      return 'TURISMOS';
    case 'Furgonetas':
      return 'FURGONETAS';
    case '4×4':
      return 'SUV_4X4';
    case 'Autocaravanas':
      return 'AUTOCARAVANAS';
    default:
      return null;
  }
}

function apiCategoryToOption(category: ApiRentalCategoryCode): RentalCategoryOption {
  switch (category) {
    case 'TURISMOS':
      return 'Turismos';
    case 'FURGONETAS':
      return 'Furgonetas';
    case 'SUV_4X4':
      return '4×4';
    case 'AUTOCARAVANAS':
      return 'Autocaravanas';
    default:
      return 'Cualquier gama';
  }
}

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const bookingState = state as CheckoutState | null;
  const rawInitialCategory = bookingState?.rentalCategory ?? bookingState?.vehicleType ?? 'Cualquier gama';
  const initialCategory = isRentalCategoryOption(rawInitialCategory)
    ? rawInitialCategory
    : 'Cualquier gama';

  const [customerData, setCustomerData] = useState<CustomerData>(initialCustomerData);
  const [extras, setExtras] = useState<Record<ToggleExtraKey, boolean>>(initialExtrasState);
  const [babySeatQty, setBabySeatQty] = useState(0);
  const [plannedKmInput, setPlannedKmInput] = useState('');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<ApiRentalCategoryCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationData, setConfirmationData] = useState<{
    confirmationCode: string;
    totalAmount: number;
  } | null>(null);

  const hasSearchState = Boolean(
    bookingState?.location && bookingState?.dateRange?.from,
  );

  // Editable search params — initialised from router state
  const [editLocation, setEditLocation] = useState<string>(bookingState?.location ?? 'Zaragoza');
  const [editDateRange, setEditDateRange] = useState<DateRange | undefined>(bookingState?.dateRange);
  const [editVehicleType, setEditVehicleType] = useState<RentalCategoryOption>(initialCategory);
  const [openSummaryDropdown, setOpenSummaryDropdown] = useState<'location' | 'category' | null>(null);
  const [isSummaryDateOpen, setIsSummaryDateOpen] = useState(false);

  const startDate = editDateRange?.from;
  const endDate = startDate
    ? editDateRange?.to && editDateRange.to.getTime() > startDate.getTime()
      ? editDateRange.to
      : addDays(startDate, 1)
    : undefined;

  const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  const officeSlug = editLocation.toLowerCase();

  const totalDays = startDate && endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const categoryParams = hasSearchState && startDateStr && endDateStr
    ? { officeSlug, startDate: startDateStr, endDate: endDateStr }
    : null;

  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useRentalCategories(categoryParams);

  useEffect(() => {
    if (!categories || categories.length === 0) {
      setSelectedCategoryCode(null);
      return;
    }

    const preferredCategory = categoryOptionToApi(editVehicleType);
    if (preferredCategory && categories.some((c) => c.category === preferredCategory)) {
      setSelectedCategoryCode(preferredCategory);
      return;
    }

    setSelectedCategoryCode((current) => {
      if (current && categories.some((c) => c.category === current)) {
        return current;
      }
      return categories[0].category;
    });
  }, [categories, editVehicleType]);

  const selectedCategory = useMemo(
    () => categories?.find((offer) => offer.category === selectedCategoryCode) ?? null,
    [categories, selectedCategoryCode],
  );

  const maxBabySeats = selectedCategory?.safeBabySeatMax ?? 0;
  const isBabySeatDisabled = !selectedCategory || maxBabySeats === 0;

  useEffect(() => {
    setBabySeatQty((current) => Math.min(current, maxBabySeats));
  }, [maxBabySeats]);

  useEffect(() => {
    if (!selectedCategory) {
      setPlannedKmInput('');
      return;
    }

    setPlannedKmInput((current) => {
      if (current.trim().length > 0) {
        return current;
      }
      return String(selectedCategory.pricing.includedKm);
    });
  }, [selectedCategory?.category, selectedCategory?.pricing.includedKm]);

  const plannedKm = Number.parseInt(plannedKmInput, 10);
  const isPlannedKmValid = Number.isFinite(plannedKm) && plannedKm > 0;

  const pricingPreview = useMemo(() => {
    const basePrice = selectedCategory?.pricing.basePrice ?? 0;
    const includedKm = selectedCategory?.pricing.includedKm ?? totalDays * 200;
    const extraKmRate = selectedCategory?.pricing.extraKmRate ?? 0;
    const extraKm = isPlannedKmValid ? Math.max(plannedKm - includedKm, 0) : 0;
    const extraKmSurcharge = roundCurrency(extraKm * extraKmRate);

    const extrasPerDay =
      babySeatQty * EXTRA_PRICE_PER_DAY.BABY_SEAT
      + (extras.snowChains ? EXTRA_PRICE_PER_DAY.SNOW_CHAINS : 0)
      + (extras.additionalDriver ? EXTRA_PRICE_PER_DAY.ADDITIONAL_DRIVER : 0);

    const extrasEstimatedTotal = roundCurrency(extrasPerDay * totalDays);
    const totalEstimated = roundCurrency(basePrice + extrasEstimatedTotal + extraKmSurcharge);

    return {
      basePrice,
      includedKm,
      extraKm,
      extraKmRate,
      extraKmSurcharge,
      extrasEstimatedTotal,
      totalEstimated,
    };
  }, [selectedCategory, totalDays, plannedKm, isPlannedKmValid, babySeatQty, extras]);

  const formattedDates = useMemo(
    () => formatDateRangeLabel({ from: startDate, to: endDate }),
    [startDate, endDate],
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

  useEffect(() => {
    if (!isSummaryDateOpen && !openSummaryDropdown) return;

    const handleOutside = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      if (e.target.closest('[data-summary-select]') || e.target.closest('[data-summary-date]')) return;
      setOpenSummaryDropdown(null);
      setIsSummaryDateOpen(false);
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenSummaryDropdown(null);
        setIsSummaryDateOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isSummaryDateOpen, openSummaryDropdown]);

  const handleEditLocation = (loc: string) => {
    setEditLocation(loc);
    setSelectedCategoryCode(null);
    setOpenSummaryDropdown(null);
  };

  const handleEditVehicleType = (category: RentalCategoryOption) => {
    setEditVehicleType(category);
    setSelectedCategoryCode(categoryOptionToApi(category));
    setOpenSummaryDropdown(null);
  };

  const handleEditDateRange = (range: DateRange | undefined) => {
    setEditDateRange(range);
    setSelectedCategoryCode(null);
    if (range?.from && range?.to) {
      setIsSummaryDateOpen(false);
    }
  };

  const toggleSummaryDropdown = (key: 'location' | 'category') => {
    setIsSummaryDateOpen(false);
    setOpenSummaryDropdown((prev) => (prev === key ? null : key));
  };

  const toggleSummaryDate = () => {
    setOpenSummaryDropdown(null);
    setIsSummaryDateOpen((prev) => !prev);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError(null);
  };

  const handleExtraToggle = (key: ToggleExtraKey) => {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDecreaseBabySeatQty = () => {
    setBabySeatQty((prev) => Math.max(prev - 1, 0));
  };

  const handleIncreaseBabySeatQty = () => {
    setBabySeatQty((prev) => Math.min(prev + 1, maxBabySeats));
  };

  const handleSelectCategoryOffer = (offer: ApiRentalCategory) => {
    setSelectedCategoryCode(offer.category);
    setEditVehicleType(apiCategoryToOption(offer.category));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading || !selectedCategoryCode || !startDateStr || !endDateStr) {
      return;
    }

    if (!isPlannedKmValid) {
      setSubmitError('Indica un número válido de kilómetros previstos.');
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    const selectedExtras = (Object.keys(extras) as ToggleExtraKey[])
      .filter((k) => extras[k])
      .map((k) => ({ key: EXTRAS_API_MAP[k], quantity: 1 }));

    if (babySeatQty > 0) {
      selectedExtras.unshift({ key: 'BABY_SEAT', quantity: babySeatQty });
    }

    try {
      const result = await api.post<{ confirmationCode: string; reservationId: string; totalAmount: number }>(
        '/api/reservations/checkout',
        {
          category: selectedCategoryCode,
          officeSlug,
          startDate: startDateStr,
          endDate: endDateStr,
          plannedKm,
          extras: selectedExtras,
          client: {
            firstName: customerData.nombre,
            lastName: customerData.apellidos,
            email: customerData.email,
            phone: customerData.telefono,
          },
        },
      );

      setConfirmationData({
        confirmationCode: result.confirmationCode,
        totalAmount: Number(result.totalAmount),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la reserva';
      setSubmitError(
        msg === 'CATEGORY_NOT_AVAILABLE'
          ? 'No hay unidades disponibles de esta gama para estas fechas. Elige otra categoría.'
          : msg === 'MAX_RENTAL_DAYS_EXCEEDED'
            ? 'La tarifa por categoría está disponible para reservas de 1 a 7 días.'
            : msg === 'INVALID_BABY_SEAT_QUANTITY'
              ? 'La cantidad de sillas de bebé supera el máximo permitido para la gama seleccionada.'
              : msg,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const summaryDayPickerClassNames: Partial<ClassNames> = {
    root: styles.rdpRoot,
    months: styles.rdpMonths,
    month: styles.rdpMonth,
    month_caption: styles.rdpMonthCaption,
    caption_label: styles.rdpCaptionLabel,
    nav: styles.rdpNav,
    button_previous: styles.rdpNavButton,
    button_next: styles.rdpNavButton,
    chevron: styles.rdpChevron,
    month_grid: styles.rdpMonthGrid,
    weekdays: styles.rdpWeekdays,
    weekday: styles.rdpWeekday,
    weeks: styles.rdpWeeks,
    week: styles.rdpWeek,
    day: styles.rdpDay,
    day_button: styles.rdpDayButton,
    disabled: styles.rdpDayDisabled,
    outside: styles.rdpDayOutside,
    today: styles.rdpDayToday,
    selected: styles.rdpDaySelected,
    range_start: styles.rdpRangeStart,
    range_middle: styles.rdpRangeMiddle,
    range_end: styles.rdpRangeEnd,
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

  if (confirmationData) {
    return (
      <main className={styles.page}>
        <div className={styles.pendingScreen}>
          <div className={styles.pendingIconWrap} aria-hidden="true">
            <span className={styles.pendingCheckmark}>✓</span>
          </div>

          <h1 className={styles.pendingTitle}>Solicitud recibida</h1>

          <p className={styles.pendingCodeLabel}>Código de solicitud</p>
          <p className={styles.pendingCode}>{confirmationData.confirmationCode}</p>

          <div className={styles.warningBox} role="alert">
            <span className={styles.warningIcon} aria-hidden="true">⚠</span>
            <div>
              <p className={styles.warningTitle}>Aviso importante</p>
              <p className={styles.warningText}>
                Esta solicitud <strong>no constituye una confirmación directa</strong> de la reserva.
              </p>
              <p className={styles.warningText}>
                Nuestro equipo la procesará y recibirás respuesta en un máximo de{' '}
                <strong>24–48 horas</strong>.
              </p>
            </div>
          </div>

          <p className={styles.emailNote}>
            Hemos enviado un resumen a <strong>{customerData.email}</strong>
          </p>

          <div className={styles.summaryBox}>
            <h2 className={styles.summaryBoxTitle}>Resumen de tu solicitud</h2>
            <ul className={styles.summaryList}>
              <li>
                <span>Categoría</span>
                <strong>{editVehicleType}</strong>
              </li>
              <li>
                <span>Sede</span>
                <strong>{editLocation}</strong>
              </li>
              <li>
                <span>Fechas</span>
                <strong>{formattedDates}</strong>
              </li>
              <li>
                <span>Total estimado</span>
                <strong>€{pricingPreview.totalEstimated.toFixed(2)}</strong>
              </li>
            </ul>
          </div>

          <button type="button" className={styles.homeButton} onClick={() => navigate('/')}>
            Volver al inicio
          </button>
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
              <div className={styles.summaryControl} data-summary-date>
                <button
                  type="button"
                  className={styles.summaryDateTrigger}
                  aria-expanded={isSummaryDateOpen}
                  onClick={toggleSummaryDate}
                >
                  <span>{formattedDates}</span>
                  <svg
                    className={`${styles.summaryChevron} ${isSummaryDateOpen ? styles.summaryChevronOpen : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isSummaryDateOpen && (
                  <div className={styles.summaryDatePopover} role="dialog" aria-label="Seleccionar fechas">
                    <DayPicker
                      mode="range"
                      locale={es}
                      weekStartsOn={1}
                      numberOfMonths={1}
                      pagedNavigation
                      showOutsideDays
                      fixedWeeks
                      selected={editDateRange}
                      onSelect={handleEditDateRange}
                      disabled={{ before: startOfToday() }}
                      defaultMonth={editDateRange?.from ?? startOfToday()}
                      classNames={summaryDayPickerClassNames}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Recogida</span>
              <div className={styles.summaryControl} data-summary-select>
                <button
                  type="button"
                  className={styles.summarySelectTrigger}
                  aria-expanded={openSummaryDropdown === 'location'}
                  onClick={() => toggleSummaryDropdown('location')}
                >
                  <span>{editLocation}</span>
                  <svg
                    className={`${styles.summaryChevron} ${openSummaryDropdown === 'location' ? styles.summaryChevronOpen : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openSummaryDropdown === 'location' && (
                  <ul className={styles.summaryDropdownMenu} role="listbox" aria-label="Ciudades de recogida">
                    {LOCATIONS.map((city) => (
                      <li key={city}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={editLocation === city}
                          className={`${styles.summaryDropdownItem} ${editLocation === city ? styles.summaryDropdownItemActive : ''}`}
                          onClick={() => handleEditLocation(city)}
                        >
                          {city}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Categoría</span>
              <div className={styles.summaryControl} data-summary-select>
                <button
                  type="button"
                  className={styles.summarySelectTrigger}
                  aria-expanded={openSummaryDropdown === 'category'}
                  onClick={() => toggleSummaryDropdown('category')}
                >
                  <span>{editVehicleType}</span>
                  <svg
                    className={`${styles.summaryChevron} ${openSummaryDropdown === 'category' ? styles.summaryChevronOpen : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openSummaryDropdown === 'category' && (
                  <ul className={styles.summaryDropdownMenu} role="listbox" aria-label="Categorías de vehículo">
                    {RENTAL_CATEGORIES.map((category) => (
                      <li key={category}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={editVehicleType === category}
                          className={`${styles.summaryDropdownItem} ${editVehicleType === category ? styles.summaryDropdownItemActive : ''}`}
                          onClick={() => handleEditVehicleType(category)}
                        >
                          {category}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </article>

          <article className={styles.vehiclesCard}>
            <h2 className={styles.extrasTitle}>Elige tu gama</h2>
            {categoriesLoading && (
              <p className={styles.vehicleLoading}>
                <span className={styles.spinner} aria-hidden="true" />
                Buscando disponibilidad por categoría...
              </p>
            )}
            {categoriesError && (
              <p className={styles.errorText}>Error al cargar categorías: {categoriesError}</p>
            )}
            {!categoriesLoading && categories && categories.length === 0 && (
              <p className={styles.extrasText}>No hay categorías disponibles para estas fechas.</p>
            )}
            {categories && categories.length > 0 && (
              <div className={styles.vehicleList}>
                {categories.map((offer) => (
                  <div
                    key={offer.category}
                    className={`${styles.vehicleItem} ${selectedCategoryCode === offer.category ? styles.vehicleItemSelected : ''}`}
                  >
                    <label className={styles.vehicleSelectLabel}>
                      <input
                        type="radio"
                        name="category"
                        value={offer.category}
                        checked={selectedCategoryCode === offer.category}
                        onChange={() => handleSelectCategoryOffer(offer)}
                        className={styles.vehicleRadio}
                      />
                      <div className={styles.vehicleItemContent}>
                        <span className={styles.vehicleName}>{apiCategoryToOption(offer.category)}</span>
                        <span className={styles.vehicleMeta}>
                          {offer.powerRange} · {offer.seatsRange} · {offer.availableUnits} unidades
                        </span>
                      </div>
                      <span className={styles.vehicleRate}>€{offer.pricing.basePrice.toFixed(0)}</span>
                    </label>
                  </div>
                ))}
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
                  <span className={styles.babySeatHint}>
                    {selectedCategory
                      ? `Máximo garantizado ${maxBabySeats} silla${maxBabySeats === 1 ? '' : 's'} según disponibilidad de la gama`
                      : 'Selecciona una gama para habilitar este extra'}
                  </span>
                </div>
                <div className={styles.babySeatCounter} aria-live="polite">
                  <button
                    type="button"
                    className={styles.babySeatBtn}
                    onClick={handleDecreaseBabySeatQty}
                    disabled={isBabySeatDisabled || babySeatQty === 0}
                    aria-label="Reducir sillas de bebé"
                  >
                    -
                  </button>
                  <span className={styles.babySeatQtyNum}>{babySeatQty}</span>
                  <button
                    type="button"
                    className={styles.babySeatBtn}
                    onClick={handleIncreaseBabySeatQty}
                    disabled={isBabySeatDisabled || babySeatQty >= maxBabySeats}
                    aria-label="Aumentar sillas de bebé"
                  >
                    +
                  </button>
                </div>
              </div>

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

          <article className={styles.extrasCard}>
            <h2 className={styles.extrasTitle}>Estimación</h2>
            <div className={styles.priceBreakdown}>
              <p className={styles.priceRow}>
                <span>Tarifa fija ({totalDays} día{totalDays === 1 ? '' : 's'})</span>
                <strong>€{pricingPreview.basePrice.toFixed(2)}</strong>
              </p>
              <p className={styles.priceRow}>
                <span>Extras seleccionados</span>
                <strong>€{pricingPreview.extrasEstimatedTotal.toFixed(2)}</strong>
              </p>
              <p className={styles.priceRow}>
                <span>
                  Exceso kilometraje ({pricingPreview.extraKm} km x €{pricingPreview.extraKmRate.toFixed(2)}/km)
                </span>
                <strong>€{pricingPreview.extraKmSurcharge.toFixed(2)}</strong>
              </p>
              <p className={`${styles.priceRow} ${styles.priceTotal}`}>
                <span>Total estimado</span>
                <strong>€{pricingPreview.totalEstimated.toFixed(2)}</strong>
              </p>
            </div>
            <p className={styles.extrasText}>
              Incluye {pricingPreview.includedKm} km para {totalDays} día{totalDays === 1 ? '' : 's'}.
            </p>
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

            <label className={styles.field}>
              <span>Kilómetros totales previstos</span>
              <input
                type="number"
                min={1}
                step={1}
                value={plannedKmInput}
                onChange={(event) => {
                  setPlannedKmInput(event.target.value);
                  if (submitError) setSubmitError(null);
                }}
                placeholder="Ej. 850"
                required
              />
            </label>
            <p className={styles.kmHint}>
              Cada día incluye 200 km. Para esta reserva tienes {pricingPreview.includedKm} km incluidos.
            </p>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || !selectedCategoryCode || categoriesLoading || !isPlannedKmValid}
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

