import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { gsap } from 'gsap';
import { DayPicker, type ClassNames, type DateRange } from 'react-day-picker';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useVehicles, type ApiVehicle } from '../hooks/useVehicles';
import styles from './CheckoutPage.module.css';

type CheckoutState = {
  dateRange?: DateRange;
  location?: string;
  vehicleType?: string;
};

type ToggleExtraKey = 'snowChains' | 'additionalDriver';
type CheckoutExtraKey = 'BABY_SEAT' | 'SNOW_CHAINS' | 'ADDITIONAL_DRIVER';

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

const CATEGORY_MAP: Record<string, string> = {
  Turismos: 'TURISMOS',
  Furgonetas: 'FURGONETAS',
  '4×4': 'SUV_4X4',
  Autocaravanas: 'AUTOCARAVANAS',
};

const LOCATIONS = ['Zaragoza', 'Tudela', 'Soria'] as const;
const VEHICLE_TYPES = ['Cualquier tipo', 'Turismos', 'Furgonetas', '4×4', 'Autocaravanas'] as const;

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

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const vehicleDialogRef = useRef<HTMLDialogElement>(null);

  const [customerData, setCustomerData] = useState<CustomerData>(initialCustomerData);
  const [extras, setExtras] = useState<Record<ToggleExtraKey, boolean>>(initialExtrasState);
  const [babySeatQty, setBabySeatQty] = useState(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [detailVehicleId, setDetailVehicleId] = useState<ApiVehicle['id'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

  const bookingState = state as CheckoutState | null;

  const hasSearchState = Boolean(
    bookingState?.location && bookingState?.vehicleType && bookingState?.dateRange?.from,
  );

  // Editable search params — initialised from router state
  const [editLocation, setEditLocation] = useState<string>(bookingState?.location ?? 'Zaragoza');
  const [editDateRange, setEditDateRange] = useState<DateRange | undefined>(bookingState?.dateRange);
  const [editVehicleType, setEditVehicleType] = useState<string>(bookingState?.vehicleType ?? 'Cualquier tipo');
  const [openSummaryDropdown, setOpenSummaryDropdown] = useState<'location' | 'category' | null>(null);
  const [isSummaryDateOpen, setIsSummaryDateOpen] = useState(false);

  const officeSlug = editLocation.toLowerCase();
  const apiCategory = editVehicleType !== 'Cualquier tipo' ? CATEGORY_MAP[editVehicleType] : undefined;
  const startDateStr = editDateRange?.from ? format(editDateRange.from, 'yyyy-MM-dd') : '';
  const endDateStr = editDateRange?.to ? format(editDateRange.to, 'yyyy-MM-dd') : startDateStr;

  const vehicleParams = hasSearchState && startDateStr
    ? { officeSlug, startDate: startDateStr, endDate: endDateStr, category: apiCategory }
    : null;

  const { vehicles, isLoading: vehiclesLoading, error: vehiclesError } = useVehicles(vehicleParams);

  const selectedVehicle = useMemo(
    () => vehicles?.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId],
  );

  const detailVehicle = useMemo(
    () => vehicles?.find((vehicle) => vehicle.id === detailVehicleId) ?? null,
    [vehicles, detailVehicleId],
  );

  const maxBabySeats = selectedVehicle ? Math.max(selectedVehicle.seats - 1, 0) : 0;
  const isBabySeatDisabled = !selectedVehicle;

  // Auto-select first vehicle when list loads
  useEffect(() => {
    if (vehicles && vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  useEffect(() => {
    if (!selectedVehicle) {
      setBabySeatQty(0);
      return;
    }
    setBabySeatQty((prev) => Math.min(prev, maxBabySeats));
  }, [selectedVehicle, maxBabySeats]);

  useEffect(() => {
    if (!detailVehicleId || detailVehicle) return;
    vehicleDialogRef.current?.close();
    setDetailVehicleId(null);
  }, [detailVehicleId, detailVehicle]);

  const formattedDates = useMemo(
    () => formatDateRangeLabel(editDateRange),
    [editDateRange],
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
    setSelectedVehicleId(null);
    setOpenSummaryDropdown(null);
  };

  const handleEditVehicleType = (type: string) => {
    setEditVehicleType(type);
    setSelectedVehicleId(null);
    setOpenSummaryDropdown(null);
  };

  const handleEditDateRange = (range: DateRange | undefined) => {
    setEditDateRange(range);
    if (range?.from && range?.to) {
      setSelectedVehicleId(null);
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

  const handleOpenVehicleDetails = (vehicle: ApiVehicle) => {
    setDetailVehicleId(vehicle.id);
    if (!vehicleDialogRef.current?.open) {
      vehicleDialogRef.current?.showModal();
    }
  };

  const handleCloseVehicleDetails = () => {
    vehicleDialogRef.current?.close();
    setDetailVehicleId(null);
  };

  const handleVehicleDialogBackdropClick = (event: ReactMouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      handleCloseVehicleDetails();
    }
  };

  const handleSelectVehicleFromDialog = (vehicle: ApiVehicle) => {
    setSelectedVehicleId(vehicle.id);
    handleCloseVehicleDetails();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || !selectedVehicleId) return;

    setIsLoading(true);
    setSubmitError(null);

    const selectedExtras = (Object.keys(extras) as ToggleExtraKey[])
      .filter((k) => extras[k])
      .map((k) => ({ key: EXTRAS_API_MAP[k], quantity: 1 }));

    if (babySeatQty > 0) {
      selectedExtras.unshift({ key: 'BABY_SEAT', quantity: babySeatQty });
    }

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
            {/* Fechas */}
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

            {/* Recogida */}
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

            {/* Categoría */}
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
                    {VEHICLE_TYPES.map((type) => (
                      <li key={type}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={editVehicleType === type}
                          className={`${styles.summaryDropdownItem} ${editVehicleType === type ? styles.summaryDropdownItemActive : ''}`}
                          onClick={() => handleEditVehicleType(type)}
                        >
                          {type}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </article>

          <article className={styles.vehiclesCard}>
            <h2 className={styles.extrasTitle}>Elige tu vehículo</h2>
            {vehiclesLoading && (
              <p className={styles.vehicleLoading}>
                <span className={styles.spinner} aria-hidden="true" />
                Buscando disponibilidad...
              </p>
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
                  <div
                    key={v.id}
                    className={`${styles.vehicleItem} ${selectedVehicleId === v.id ? styles.vehicleItemSelected : ''}`}
                  >
                    <label className={styles.vehicleSelectLabel}>
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
                    <button
                      type="button"
                      className={styles.vehicleDetailsBtn}
                      onClick={() => handleOpenVehicleDetails(v)}
                    >
                      Ver detalles
                    </button>
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
                    {selectedVehicle
                      ? `Máximo ${maxBabySeats} silla${maxBabySeats === 1 ? '' : 's'} para este vehículo`
                      : 'Selecciona un vehículo para habilitar este extra'}
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

          <dialog
            ref={vehicleDialogRef}
            className={styles.vehicleModal}
            onClick={handleVehicleDialogBackdropClick}
            onClose={() => setDetailVehicleId(null)}
          >
            {detailVehicle && (
              <>
                <button
                  type="button"
                  className={styles.vehicleModalClose}
                  onClick={handleCloseVehicleDetails}
                  aria-label="Cerrar detalles del vehículo"
                >
                  ×
                </button>
                <img
                  src={detailVehicle.imageUrl}
                  alt={`${detailVehicle.brand} ${detailVehicle.model}`}
                  className={styles.vehicleModalImage}
                />
                <div className={styles.vehicleModalBody}>
                  <header className={styles.vehicleModalHeader}>
                    <h3 className={styles.vehicleModalTitle}>{detailVehicle.brand} {detailVehicle.model}</h3>
                    <p className={styles.vehicleModalBadge}>{detailVehicle.highlight}</p>
                  </header>

                  <ul className={styles.vehicleModalSpecs}>
                    <li className={styles.vehicleModalSpecItem}>
                      <span className={styles.vehicleModalSpecLabel}>Potencia</span>
                      <span className={styles.vehicleModalSpecValue}>{detailVehicle.power}</span>
                    </li>
                    <li className={styles.vehicleModalSpecItem}>
                      <span className={styles.vehicleModalSpecLabel}>Plazas</span>
                      <span className={styles.vehicleModalSpecValue}>{detailVehicle.seats}</span>
                    </li>
                    <li className={styles.vehicleModalSpecItem}>
                      <span className={styles.vehicleModalSpecLabel}>Combustible</span>
                      <span className={styles.vehicleModalSpecValue}>{detailVehicle.fuelType}</span>
                    </li>
                    <li className={styles.vehicleModalSpecItem}>
                      <span className={styles.vehicleModalSpecLabel}>Transmisión</span>
                      <span className={styles.vehicleModalSpecValue}>{detailVehicle.transmissionType}</span>
                    </li>
                    <li className={styles.vehicleModalSpecItem}>
                      <span className={styles.vehicleModalSpecLabel}>Descripción</span>
                      <span className={styles.vehicleModalSpecValue}>{detailVehicle.highlight}</span>
                    </li>
                    <li className={styles.vehicleModalSpecItem}>
                      <span className={styles.vehicleModalSpecLabel}>Precio diario</span>
                      <span className={styles.vehicleModalSpecValue}>€{Number(detailVehicle.dailyRate).toFixed(0)}/día</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    className={styles.vehicleModalSelectBtn}
                    onClick={() => handleSelectVehicleFromDialog(detailVehicle)}
                  >
                    {selectedVehicleId === detailVehicle.id ? 'Vehículo seleccionado' : 'Seleccionar este vehículo'}
                  </button>
                </div>
              </>
            )}
          </dialog>
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
