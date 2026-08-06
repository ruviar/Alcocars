import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { DayPicker, type ClassNames, type DateRange } from 'react-day-picker';
import { addDays, format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SUPER_CATEGORIES, tariffs, type SuperCategory, type TariffEntry } from '../data/tariffs';
import { extras as EXTRAS_CATALOG, extraTotal, type ExtraEntry } from '../data/extras';
import { company, officeBySlug, officeLabel, officeSlugByCity, offices } from '../data/offices';
import { api } from '../lib/api';
import PhoneInput from '../components/PhoneInput/PhoneInput';
import styles from './CheckoutPage.module.css';

type CheckoutState = {
  dateRange?: { from?: Date | string; to?: Date | string };
  location?: string;
  rentalCategory?: string;
  vehicleType?: string;
  superCategory?: SuperCategory;
  tariffId?: string;
};

type StepNumber = 1 | 2 | 3 | 4;

type PersonalData = {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  observaciones: string;
};

type CheckoutResponse = {
  reservationId: string;
  confirmationCode: string;
  needsAvailabilityCheck: boolean;
  quote: { totalAmount: number | null };
  notification: { delivered: boolean; admin: string; customer: string };
};

const STEP_META: Record<StepNumber, { short: string; title: string; description: string }> = {
  1: {
    short: 'Fechas',
    title: 'Fechas y ubicación',
    description: 'Define recogida, devolución, horarios y kilometraje previsto.',
  },
  2: {
    short: 'Vehículo',
    title: 'Tipo de vehículo',
    description: 'Confirma la gama de la flota o cámbiala según tu necesidad.',
  },
  3: {
    short: 'Extras',
    title: 'Extras',
    description: 'Añade los servicios adicionales que necesites para tu viaje.',
  },
  4: {
    short: 'Resumen',
    title: 'Resumen y datos personales',
    description: 'Revisa el desglose final y déjanos tus datos para contactarte.',
  },
};

/** Tope del formulario web; por encima, la reserva se cotiza a mano. */
const MAX_RENTAL_DAYS = 90;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El recargo por devolver en otra oficina se añade automáticamente. */
const DIFFERENT_OFFICE_EXTRA_ID = 'differentOfficeReturn';

const API_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Revisa los datos del formulario: hay algún campo inválido.',
  INVALID_DATE_RANGE: 'Las fechas seleccionadas no son válidas.',
  MIN_RENTAL_DURATION: 'El alquiler mínimo es de 24 horas: adelanta la hora de recogida o retrasa la de devolución.',
  MAX_RENTAL_DAYS_EXCEEDED: `Para alquileres de más de ${MAX_RENTAL_DAYS} días, contáctanos y te preparamos una propuesta a medida.`,
  TARIFF_NOT_FOUND: 'La gama seleccionada ya no está disponible. Vuelve al paso 2 y elige otra.',
  OFFICE_NOT_FOUND: 'La oficina seleccionada no es válida.',
  RETURN_OFFICE_NOT_FOUND: 'La oficina de devolución no es válida.',
  EXTRA_NOT_FOUND: 'Alguno de los extras seleccionados ya no está disponible.',
  INVALID_EXTRA_QUANTITY: 'Revisa las cantidades de los extras seleccionados.',
};

function buildTimeOptions(): string[] {
  const values: string[] = [];

  for (let hour = 7; hour <= 22; hour += 1) {
    const hh = String(hour).padStart(2, '0');
    values.push(`${hh}:00`);
    if (hour < 22) {
      values.push(`${hh}:30`);
    }
  }

  return values;
}

const TIME_OPTIONS = buildTimeOptions();

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toDateSafe(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function formatHumanDate(dateIso: string): string {
  if (!dateIso) {
    return '--';
  }

  const value = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(value.getTime())) {
    return '--';
  }

  return format(value, 'd MMM yyyy', { locale: es });
}

function toDateFromIso(dateIso: string): Date | undefined {
  if (!dateIso) {
    return undefined;
  }

  const date = new Date(`${dateIso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function resolveSuperCategory(rawValue?: string): SuperCategory | null {
  if (!rawValue) {
    return null;
  }

  const normalized = rawValue.toLowerCase();

  if (normalized.includes('coche') || normalized.includes('turismo')) {
    return 'Coches';
  }

  if (normalized.includes('furgoneta')) {
    return 'Furgonetas';
  }

  if (
    normalized.includes('4x4')
    || normalized.includes('4×4')
    || normalized.includes('todoterreno')
    || normalized.includes('suv')
  ) {
    return 'Todoterrenos';
  }

  if (normalized.includes('autocaravana')) {
    return 'Autocaravanas';
  }

  return null;
}

function resolveInitialTariffId(state: CheckoutState | null): string {
  if (state?.tariffId && tariffs.some((tariff) => tariff.id === state.tariffId)) {
    return state.tariffId;
  }

  const selectedCategory =
    state?.superCategory
    ?? resolveSuperCategory(state?.rentalCategory)
    ?? resolveSuperCategory(state?.vehicleType)
    ?? null;

  if (selectedCategory) {
    const categoryTariffs = tariffs.filter((tariff) => tariff.superCategory === selectedCategory);
    const preferred = categoryTariffs.find((tariff) => !tariff.consultOnly) ?? categoryTariffs[0];

    if (preferred) {
      return preferred.id;
    }
  }

  return tariffs.find((tariff) => !tariff.consultOnly)?.id ?? tariffs[0]?.id ?? '';
}

/** Margen de cortesía publicado en las condiciones: 1 h en la devolución. */
const RETURN_GRACE_MINUTES = 60;

function parseTimeMinutes(value: string): number {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function calendarDaysBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Duración nominal en minutos: días de calendario × 24 h más la diferencia
 * entre horas. Independiente de la zona horaria del navegador y del cambio de
 * hora — espejo de `nominalRentalMinutes` del servidor.
 */
function nominalRentalMinutes(
  startIso: string,
  startTime: string,
  endIso: string,
  endTime: string,
): number {
  if (!startIso || !endIso) {
    return 0;
  }

  return (
    calendarDaysBetween(startIso, endIso) * 1440 +
    (parseTimeMinutes(endTime) - parseTimeMinutes(startTime))
  );
}

/**
 * Días facturables según las condiciones publicadas: periodos de 24 h con 1 h
 * de cortesía. Recogida 10:00 → devolución 18:00 del día siguiente son 32 h,
 * es decir, 2 días. Espejo exacto de `billableRentalDays` del servidor, que es
 * quien tiene la última palabra sobre el importe.
 */
function getBillableDays(nominalMinutes: number): number {
  if (nominalMinutes <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil((nominalMinutes - RETURN_GRACE_MINUTES) / 1440));
}

function getBaseTariffPrice(tariff: TariffEntry, totalDays: number): number | null {
  if (totalDays <= 0) {
    return 0;
  }

  if (tariff.consultOnly || tariff.rates.length === 0) {
    return null;
  }

  if (totalDays <= tariff.rates.length) {
    return tariff.rates[totalDays - 1] ?? null;
  }

  const weekRate = tariff.rates[tariff.rates.length - 1];
  if (weekRate === undefined) {
    return null;
  }

  const fullWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;
  const remainingRate = remainingDays > 0
    ? tariff.rates[Math.min(remainingDays, tariff.rates.length) - 1] ?? weekRate
    : 0;

  return roundCurrency(fullWeeks * weekRate + remainingRate);
}

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const bookingState = (state as CheckoutState | null) ?? null;

  const today = startOfToday();
  const initialFromDate = toDateSafe(bookingState?.dateRange?.from) ?? today;
  const tentativeToDate = toDateSafe(bookingState?.dateRange?.to) ?? addDays(initialFromDate, 1);
  const initialToDate = tentativeToDate > initialFromDate ? tentativeToDate : addDays(initialFromDate, 1);
  const initialOfficeSlug = officeSlugByCity(bookingState?.location);

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [pickupDate, setPickupDate] = useState<string>(() => toIsoDate(initialFromDate));
  const [returnDate, setReturnDate] = useState<string>(() => toIsoDate(initialToDate));
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnTime, setReturnTime] = useState('18:00');
  const [pickupOfficeSlug, setPickupOfficeSlug] = useState<string>(initialOfficeSlug);
  const [returnOfficeSlug, setReturnOfficeSlug] = useState<string>(initialOfficeSlug);
  const [plannedKmInput, setPlannedKmInput] = useState('200');
  const [selectedTariffId, setSelectedTariffId] = useState<string>(() => resolveInitialTariffId(bookingState));
  const [activeVehicleCategory, setActiveVehicleCategory] = useState<SuperCategory>(
    () => tariffs.find((tariff) => tariff.id === resolveInitialTariffId(bookingState))?.superCategory
      ?? SUPER_CATEGORIES[0],
  );
  /** cantidad contratada por extra (0 = no seleccionado) */
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [personalData, setPersonalData] = useState<PersonalData>({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    observaciones: '',
  });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [confirmation, setConfirmation] = useState<CheckoutResponse | null>(null);

  useEffect(() => {
    if (!pickupDate || !returnDate || returnDate > pickupDate) {
      return;
    }

    const nextReturnDate = addDays(new Date(`${pickupDate}T00:00:00`), 1);
    setReturnDate(toIsoDate(nextReturnDate));
  }, [pickupDate, returnDate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, confirmation]);

  const selectedTariff = useMemo(
    () => tariffs.find((tariff) => tariff.id === selectedTariffId) ?? null,
    [selectedTariffId],
  );

  const nominalMinutes = useMemo(
    () => nominalRentalMinutes(pickupDate, pickupTime, returnDate, returnTime),
    [pickupDate, pickupTime, returnDate, returnTime],
  );

  const totalDays = useMemo(() => getBillableDays(nominalMinutes), [nominalMinutes]);

  const isDifferentOfficeReturn = returnOfficeSlug !== pickupOfficeSlug;

  const plannedKm = Number.parseInt(plannedKmInput, 10);
  const isPlannedKmValid = Number.isFinite(plannedKm) && plannedKm > 0 && plannedKm <= 50_000;
  const includedKm = selectedTariff ? selectedTariff.kmPerDay * totalDays : 0;
  const extraKm = Math.max((isPlannedKmValid ? plannedKm : 0) - includedKm, 0);
  const extraKmSurcharge = selectedTariff ? roundCurrency(extraKm * selectedTariff.kmExtra) : 0;
  const baseTariffPrice = selectedTariff ? getBaseTariffPrice(selectedTariff, totalDays) : 0;

  /** Extras efectivos: los marcados por el usuario más el automático de devolución. */
  const effectiveExtras = useMemo(() => {
    const rows: Array<{ extra: ExtraEntry; quantity: number; auto: boolean }> = [];

    for (const extra of EXTRAS_CATALOG) {
      if (extra.id === DIFFERENT_OFFICE_EXTRA_ID) {
        if (isDifferentOfficeReturn) {
          rows.push({ extra, quantity: 1, auto: true });
        }
        continue;
      }

      const quantity = extraQuantities[extra.id] ?? 0;
      if (quantity > 0) {
        rows.push({ extra, quantity, auto: false });
      }
    }

    return rows;
  }, [extraQuantities, isDifferentOfficeReturn]);

  const extrasTotal = useMemo(
    () => roundCurrency(
      effectiveExtras.reduce((sum, row) => sum + extraTotal(row.extra, row.quantity, totalDays), 0),
    ),
    [effectiveExtras, totalDays],
  );

  const finalTotal = baseTariffPrice === null
    ? null
    : roundCurrency(baseTariffPrice + extraKmSurcharge + extrasTotal);

  const isDateRangeValid = pickupDate.length > 0 && returnDate.length > 0 && returnDate > pickupDate;
  const meetsMinDuration = nominalMinutes >= 24 * 60;
  const isWithinMaxDays = totalDays <= MAX_RENTAL_DAYS;
  const isStep1Valid = Boolean(
    pickupOfficeSlug
    && returnOfficeSlug
    && pickupTime
    && returnTime
    && isDateRangeValid
    && meetsMinDuration
    && isWithinMaxDays
    && isPlannedKmValid,
  );
  const isStep2Valid = Boolean(selectedTariffId);
  const isEmailValid = EMAIL_PATTERN.test(personalData.email.trim());
  const isPhoneValid = personalData.telefono.trim().length >= 6;
  const isStep4Valid =
    personalData.nombre.trim().length > 0
    && personalData.apellidos.trim().length > 0
    && isEmailValid
    && isPhoneValid
    && consentAccepted;

  const progressPercentage = ((currentStep - 1) / 3) * 100;

  const selectedDateRange = useMemo<DateRange | undefined>(() => {
    const from = toDateFromIso(pickupDate);
    const to = toDateFromIso(returnDate);

    if (!from) {
      return undefined;
    }

    return { from, to };
  }, [pickupDate, returnDate]);

  const dayPickerClassNames: Partial<ClassNames> = {
    root: styles.dayPicker,
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

  const handleDateRangeSelect = (nextRange: DateRange | undefined) => {
    if (!nextRange?.from) {
      return;
    }

    setPickupDate(toIsoDate(nextRange.from));

    if (nextRange.to && nextRange.to > nextRange.from) {
      setReturnDate(toIsoDate(nextRange.to));
    } else {
      setReturnDate(toIsoDate(addDays(nextRange.from, 1)));
    }

    setStepError(null);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !isStep1Valid) {
      if (!isWithinMaxDays) {
        setStepError(
          `El formulario admite hasta ${MAX_RENTAL_DAYS} días. Para periodos más largos, contáctanos y te preparamos una propuesta de renting a medida.`,
        );
      } else if (isDateRangeValid && !meetsMinDuration) {
        setStepError('El alquiler mínimo es de 24 horas: ajusta las horas de recogida y devolución.');
      } else {
        setStepError('Completa fechas, horarios, ubicaciones y un kilometraje válido para continuar.');
      }
      return;
    }

    if (currentStep === 2 && !isStep2Valid) {
      setStepError('Selecciona una gama de vehículo para continuar.');
      return;
    }

    setStepError(null);
    setCurrentStep((prev) => {
      if (prev >= 4) {
        return 4;
      }

      return (prev + 1) as StepNumber;
    });
  };

  const handlePreviousStep = () => {
    setStepError(null);
    setCurrentStep((prev) => {
      if (prev <= 1) {
        return 1;
      }

      return (prev - 1) as StepNumber;
    });
  };

  const handleExtraQuantity = (extra: ExtraEntry, nextQuantity: number) => {
    const clamped = Math.max(0, Math.min(extra.maxQuantity, nextQuantity));
    setExtraQuantities((prev) => ({ ...prev, [extra.id]: clamped }));
    setStepError(null);
  };

  const handlePersonalDataChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    if (
      name === 'nombre'
      || name === 'apellidos'
      || name === 'email'
      || name === 'telefono'
      || name === 'observaciones'
    ) {
      setPersonalData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (stepError) {
      setStepError(null);
    }

    if (submitError) {
      setSubmitError(null);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPersonalData((prev) => ({ ...prev, telefono: value }));

    if (stepError) {
      setStepError(null);
    }

    if (submitError) {
      setSubmitError(null);
    }
  };

  const goToStep = (step: StepNumber) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      setStepError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSending) {
      return;
    }

    if (!isStep1Valid) {
      setCurrentStep(1);
      setStepError('Revisa los datos del paso 1 antes de enviar.');
      return;
    }

    if (!isStep2Valid) {
      setCurrentStep(2);
      setStepError('Selecciona una gama en el paso 2 antes de enviar.');
      return;
    }

    if (!isStep4Valid) {
      setStepError(
        consentAccepted
          ? 'Completa nombre, apellidos, email válido y teléfono para enviar la solicitud.'
          : 'Debes aceptar la política de privacidad para enviar la solicitud.',
      );
      return;
    }

    setIsSending(true);
    setSubmitError(null);

    try {
      const response = await api.post<CheckoutResponse>('/api/reservations/checkout', {
        tariffId: selectedTariffId,
        pickupOfficeSlug,
        returnOfficeSlug,
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
        plannedKm,
        extras: effectiveExtras.map((row) => ({ id: row.extra.id, quantity: row.quantity })),
        client: {
          firstName: personalData.nombre.trim(),
          lastName: personalData.apellidos.trim(),
          email: personalData.email.trim(),
          phone: personalData.telefono.trim(),
        },
        notes: personalData.observaciones.trim() || undefined,
        consent: true,
      });

      setConfirmation(response);
    } catch (error: unknown) {
      const code = error instanceof Error ? error.message : '';
      setSubmitError(
        API_ERROR_MESSAGES[code]
          ?? `No se pudo enviar la solicitud. Inténtalo de nuevo o llámanos al ${company.phone}.`,
      );
    } finally {
      setIsSending(false);
    }
  };

  if (confirmation) {
    const emailDelivered = confirmation.notification.delivered;

    return (
      <main className={styles.page}>
        <div className={styles.layout}>
          <section className={styles.successCard} aria-live="polite">
            <p className={styles.kicker}>Solicitud registrada</p>
            <h1 className={styles.successTitle}>Gracias, te contactamos muy pronto</h1>

            <div className={styles.successCode}>
              <span className={styles.successCodeLabel}>Tu código de solicitud</span>
              <strong className={styles.successCodeValue}>{confirmation.confirmationCode}</strong>
              <span className={styles.successCodeHint}>Guárdalo para cualquier consulta.</span>
            </div>

            <p className={styles.successText}>
              Hemos registrado tu solicitud y {emailDelivered
                ? 'te hemos enviado un resumen por email. Nuestro equipo comprobará la disponibilidad y te contactará en un máximo de 24–48 horas laborables para confirmar la reserva.'
                : 'nuestro equipo la revisará en breve. Comprobaremos la disponibilidad y te contactaremos en un máximo de 24–48 horas laborables.'}
            </p>

            {!emailDelivered && (
              <p className={styles.successWarning} role="alert">
                No hemos podido enviar el email de confirmación en este momento. Tu solicitud está
                guardada con el código de arriba: si no te contactamos en 24 horas, llámanos al{' '}
                <a href={`tel:+34${company.phone.replace(/\s+/g, '')}`}>{company.phone}</a> indicándolo.
              </p>
            )}

            <div className={styles.successSummary}>
              <p>
                <span>Gama elegida</span>
                <strong>{selectedTariff?.name ?? 'Sin seleccionar'}</strong>
              </p>
              <p>
                <span>Fechas</span>
                <strong>
                  {formatHumanDate(pickupDate)} {pickupTime} — {formatHumanDate(returnDate)} {returnTime}
                </strong>
              </p>
              <p>
                <span>Recogida</span>
                <strong>{officeBySlug(pickupOfficeSlug)?.city ?? pickupOfficeSlug}</strong>
              </p>
              <p>
                <span>Total estimado</span>
                <strong>
                  {confirmation.quote.totalAmount === null
                    ? 'A consultar'
                    : formatCurrency(confirmation.quote.totalAmount)}
                </strong>
              </p>
            </div>

            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => navigate('/flota')}
              >
                Volver a flota
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => navigate('/')}
              >
                Ir al inicio
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <header className={styles.header}>
          <p className={styles.kicker}>Reserva paso a paso</p>
          <h1 className={styles.title}>Solicita tu reserva</h1>
          <p className={styles.subtitle}>
            Completa cada paso y recibe al momento un resumen con tu código de solicitud.
            Sin pagos por adelantado: confirmamos disponibilidad contigo antes de cerrar nada.
          </p>

          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
          </div>

          <ol className={styles.stepsNav}>
            {([1, 2, 3, 4] as StepNumber[]).map((step) => {
              const isCurrent = step === currentStep;
              const isCompleted = step < currentStep;
              const isLocked = step > currentStep;

              return (
                <li key={step}>
                  <button
                    type="button"
                    className={[
                      styles.stepChip,
                      isCurrent ? styles.stepChipActive : '',
                      isCompleted ? styles.stepChipDone : '',
                      isLocked ? styles.stepChipLocked : '',
                    ].join(' ')}
                    onClick={() => goToStep(step)}
                    disabled={isLocked}
                  >
                    {step}. {STEP_META[step].short}
                  </button>
                </li>
              );
            })}
          </ol>
        </header>

        <div className={styles.contentGrid}>
          <form className={styles.wizardCard} onSubmit={handleSubmit}>
            <div className={styles.stepMeta}>
              <p className={styles.stepCounter}>Paso {currentStep} de 4</p>
              <h2 className={styles.stepTitle}>{STEP_META[currentStep].title}</h2>
              <p className={styles.stepDescription}>{STEP_META[currentStep].description}</p>
            </div>

            <div className={styles.stepView}>
              {currentStep === 1 && (
                <>
                  <section className={styles.calendarSection} aria-label="Selección de rango de fechas">
                    <div className={styles.calendarHeader}>
                      <span className={styles.fieldLabel}>Selecciona el intervalo de fechas</span>
                      <p className={styles.helperText}>
                        Marca en el calendario el día de recogida y el de devolución.
                      </p>
                    </div>

                    <div className={styles.calendarWrapper}>
                      <DayPicker
                        mode="range"
                        locale={es}
                        weekStartsOn={1}
                        numberOfMonths={2}
                        pagedNavigation
                        fixedWeeks
                        showOutsideDays
                        selected={selectedDateRange}
                        onSelect={handleDateRangeSelect}
                        disabled={{ before: today }}
                        defaultMonth={selectedDateRange?.from ?? today}
                        classNames={dayPickerClassNames}
                      />
                    </div>

                    <div className={styles.calendarPreview}>
                      <p>
                        <span>Recogida</span>
                        <strong>{formatHumanDate(pickupDate)}</strong>
                      </p>
                      <p>
                        <span>Devolución</span>
                        <strong>{formatHumanDate(returnDate)}</strong>
                      </p>
                      <p>
                        <span>Días facturables</span>
                        <strong>{totalDays > 0 ? totalDays : '--'}</strong>
                      </p>
                    </div>
                    <p className={styles.helperText}>
                      Cada día de alquiler son 24 horas desde la recogida, con 1 hora de cortesía en la
                      devolución; superada la cortesía se cuenta un día adicional.
                    </p>
                  </section>

                  <div className={styles.fieldGridTwo}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Hora de recogida</span>
                      <select
                        className={styles.selectControl}
                        value={pickupTime}
                        onChange={(event) => {
                          setPickupTime(event.target.value);
                          setStepError(null);
                        }}
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Hora de devolución</span>
                      <select
                        className={styles.selectControl}
                        value={returnTime}
                        onChange={(event) => {
                          setReturnTime(event.target.value);
                          setStepError(null);
                        }}
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className={styles.fieldGridTwo}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Oficina de recogida</span>
                      <select
                        className={styles.selectControl}
                        value={pickupOfficeSlug}
                        onChange={(event) => {
                          setPickupOfficeSlug(event.target.value);
                          setStepError(null);
                        }}
                      >
                        {offices.map((office) => (
                          <option key={office.id} value={office.id}>{officeLabel(office)}</option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Oficina de devolución</span>
                      <select
                        className={styles.selectControl}
                        value={returnOfficeSlug}
                        onChange={(event) => {
                          setReturnOfficeSlug(event.target.value);
                          setStepError(null);
                        }}
                      >
                        {offices.map((office) => (
                          <option key={office.id} value={office.id}>{officeLabel(office)}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {isDifferentOfficeReturn && (
                    <p className={styles.helperText}>
                      Devolver en una oficina distinta añade un suplemento de{' '}
                      {formatCurrency(
                        EXTRAS_CATALOG.find((extra) => extra.id === DIFFERENT_OFFICE_EXTRA_ID)?.price ?? 0,
                      )}{' '}
                      que verás reflejado en el resumen.
                    </p>
                  )}

                  <div className={styles.fieldGridOne}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Kilometraje total previsto</span>
                      <input
                        className={styles.inputControl}
                        type="number"
                        min={1}
                        max={50000}
                        step={1}
                        value={plannedKmInput}
                        onChange={(event) => {
                          setPlannedKmInput(event.target.value);
                          setStepError(null);
                        }}
                        required
                      />
                      <span className={styles.helperText}>
                        La tarifa incluye 200 km por día (máximo del formulario: 50.000 km).
                        Si prevés más kilómetros, te calculamos el recargo por adelantado para que no haya sorpresas.
                      </span>
                    </label>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <div className={styles.vehicleGroups}>
                  <div className={styles.categoryTabs} role="tablist" aria-label="Categorías de vehículo">
                    {SUPER_CATEGORIES.map((category) => {
                      const count = tariffs.filter((tariff) => tariff.superCategory === category).length;

                      return (
                        <button
                          key={category}
                          type="button"
                          role="tab"
                          aria-selected={activeVehicleCategory === category}
                          className={`${styles.categoryTab} ${activeVehicleCategory === category ? styles.categoryTabActive : ''}`}
                          onClick={() => setActiveVehicleCategory(category)}
                        >
                          {category}
                          <span className={styles.categoryTabCount}>{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.vehicleList}>
                    {tariffs
                      .filter((tariff) => tariff.superCategory === activeVehicleCategory)
                      .map((tariff) => {
                        const isSelected = selectedTariffId === tariff.id;

                        return (
                          <label
                            key={tariff.id}
                            className={`${styles.vehicleCard} ${isSelected ? styles.vehicleCardSelected : ''}`}
                          >
                            <div className={styles.vehicleHeader}>
                              <input
                                className={styles.vehicleRadio}
                                type="radio"
                                name="vehicle-tariff"
                                value={tariff.id}
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedTariffId(tariff.id);
                                  setStepError(null);
                                }}
                              />
                              <div>
                                <p className={styles.vehicleTitle}>{tariff.name}</p>
                                <p className={styles.vehicleMeta}>
                                  {tariff.kmPerDay} km/día incluidos · {tariff.kmExtra.toFixed(2).replace('.', ',')} €/km extra
                                </p>
                              </div>
                            </div>

                            <p className={styles.vehiclePrice}>
                              {tariff.consultOnly
                                ? 'Tarifa base bajo consulta'
                                : `${formatCurrency(tariff.rates[0] ?? 0)} / día`}
                            </p>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <>
                  <div className={styles.extrasList}>
                    {EXTRAS_CATALOG.map((extra) => {
                      const isAutoExtra = extra.id === DIFFERENT_OFFICE_EXTRA_ID;
                      const quantity = isAutoExtra
                        ? (isDifferentOfficeReturn ? 1 : 0)
                        : (extraQuantities[extra.id] ?? 0);
                      const isChecked = quantity > 0;
                      const unitSuffix = extra.unit === 'per_day' ? '/día' : '';

                      return (
                        <label
                          key={extra.id}
                          className={`${styles.extraItem} ${isAutoExtra ? styles.extraItemLocked : ''}`}
                        >
                          <input
                            className={styles.extraCheckbox}
                            type="checkbox"
                            checked={isChecked}
                            disabled={isAutoExtra}
                            onChange={() => handleExtraQuantity(extra, isChecked ? 0 : 1)}
                          />
                          <div className={styles.extraBody}>
                            <span className={styles.extraLabel}>
                              {extra.label}
                              {isAutoExtra && (
                                <span className={styles.extraAutoNote}>
                                  {isDifferentOfficeReturn
                                    ? ' — añadido automáticamente al devolver en otra oficina'
                                    : ' — se añade solo si eliges otra oficina de devolución en el paso 1'}
                                </span>
                              )}
                              {!isAutoExtra && extra.hint && (
                                <span className={styles.extraAutoNote}> — {extra.hint}</span>
                              )}
                            </span>
                            <span className={styles.extraControls}>
                              {!isAutoExtra && extra.maxQuantity > 1 && isChecked && (
                                <span className={styles.qtyStepper} aria-label={`Cantidad de ${extra.label}`}>
                                  <button
                                    type="button"
                                    className={styles.qtyBtn}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      handleExtraQuantity(extra, quantity - 1);
                                    }}
                                    aria-label="Quitar uno"
                                  >
                                    −
                                  </button>
                                  <span className={styles.qtyValue}>{quantity}</span>
                                  <button
                                    type="button"
                                    className={styles.qtyBtn}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      handleExtraQuantity(extra, quantity + 1);
                                    }}
                                    disabled={quantity >= extra.maxQuantity}
                                    aria-label="Añadir uno"
                                  >
                                    +
                                  </button>
                                </span>
                              )}
                              <strong className={styles.extraPrice}>
                                {formatCurrency(extra.price)}{unitSuffix}
                              </strong>
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <p className={styles.helperText}>
                    Los importes de los extras se suman automáticamente al total estimado del paso final.
                    Los extras por día se calculan según la duración del alquiler.
                  </p>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <section className={styles.summaryPanel}>
                    <h3 className={styles.summaryTitle}>Presupuesto estimado</h3>

                    <div className={styles.invoiceMeta}>
                      <p>
                        <span>Periodo</span>
                        <strong>
                          {formatHumanDate(pickupDate)} {pickupTime} — {formatHumanDate(returnDate)} {returnTime}
                        </strong>
                      </p>
                      <p>
                        <span>Recogida y devolución</span>
                        <strong>
                          {officeBySlug(pickupOfficeSlug)?.city ?? pickupOfficeSlug}
                          {' → '}
                          {officeBySlug(returnOfficeSlug)?.city ?? returnOfficeSlug}
                        </strong>
                      </p>
                      <p>
                        <span>Gama</span>
                        <strong>{selectedTariff?.name ?? '--'}</strong>
                      </p>
                    </div>

                    <ul className={styles.summaryList}>
                      <li className={styles.summaryListItem}>
                        <span className={styles.summaryLabel}>Tarifa base ({totalDays} día{totalDays === 1 ? '' : 's'})</span>
                        <strong className={styles.summaryValue}>
                          {selectedTariff
                            ? (baseTariffPrice === null ? 'A consultar' : formatCurrency(baseTariffPrice))
                            : '--'}
                        </strong>
                      </li>

                      <li className={styles.summaryListItem}>
                        <span className={styles.summaryLabel}>Recargo por km extra ({extraKm} km)</span>
                        <strong className={styles.summaryValue}>{formatCurrency(extraKmSurcharge)}</strong>
                      </li>

                      <li className={styles.summaryListItem}>
                        <span className={styles.summaryLabel}>Extras seleccionados</span>
                        <strong className={styles.summaryValue}>{formatCurrency(extrasTotal)}</strong>
                      </li>

                      <li className={`${styles.summaryListItem} ${styles.summaryListTotal}`}>
                        <span className={styles.summaryLabel}>Total estimado</span>
                        <strong className={styles.summaryValue}>
                          {finalTotal === null ? 'A consultar' : formatCurrency(finalTotal)}
                        </strong>
                      </li>
                    </ul>

                    <p className={styles.helperText}>
                      Incluidos: {includedKm} km. Si los superas, se aplica{' '}
                      {selectedTariff ? `${selectedTariff.kmExtra.toFixed(2).replace('.', ',')} €/km` : '--'}.
                      {selectedTariff && !selectedTariff.consultOnly && (
                        <> Fianza de {formatCurrency(selectedTariff.deposit)} y franquicia de{' '}
                        {formatCurrency(selectedTariff.franchise)}.</>
                      )}
                    </p>

                    <div className={styles.extrasSummaryList}>
                      {effectiveExtras.length === 0 && (
                        <p className={styles.emptyExtras}>No has seleccionado extras.</p>
                      )}

                      {effectiveExtras.map((row) => (
                        <p key={row.extra.id}>
                          <span>
                            {row.extra.label}
                            {row.quantity > 1 ? ` × ${row.quantity}` : ''}
                          </span>
                          <strong>{formatCurrency(extraTotal(row.extra, row.quantity, totalDays))}</strong>
                        </p>
                      ))}
                    </div>
                  </section>

                  <section className={styles.contactPanel}>
                    <h3 className={styles.summaryTitle}>Datos de contacto</h3>

                    <div className={styles.fieldGridTwo}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Nombre</span>
                        <input
                          className={styles.inputControl}
                          type="text"
                          name="nombre"
                          value={personalData.nombre}
                          onChange={handlePersonalDataChange}
                          placeholder="Tu nombre"
                          autoComplete="given-name"
                          maxLength={80}
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Apellidos</span>
                        <input
                          className={styles.inputControl}
                          type="text"
                          name="apellidos"
                          value={personalData.apellidos}
                          onChange={handlePersonalDataChange}
                          placeholder="Tus apellidos"
                          autoComplete="family-name"
                          maxLength={120}
                          required
                        />
                      </label>
                    </div>

                    <div className={styles.fieldGridTwo}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Email</span>
                        <input
                          className={styles.inputControl}
                          type="email"
                          name="email"
                          value={personalData.email}
                          onChange={handlePersonalDataChange}
                          placeholder="tu@email.com"
                          autoComplete="email"
                          maxLength={160}
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Teléfono</span>
                        <PhoneInput
                          value={personalData.telefono}
                          onChange={handlePhoneChange}
                          name="telefono"
                          required
                        />
                      </label>
                    </div>

                    <div className={styles.fieldGridOne}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Observaciones</span>
                        <textarea
                          className={styles.textareaControl}
                          name="observaciones"
                          value={personalData.observaciones}
                          onChange={handlePersonalDataChange}
                          placeholder="Cuéntanos cualquier detalle que nos ayude a preparar tu reserva"
                          maxLength={1000}
                          rows={4}
                        />
                      </label>
                    </div>

                    <label className={styles.consentRow}>
                      <input
                        type="checkbox"
                        className={styles.extraCheckbox}
                        checked={consentAccepted}
                        onChange={(event) => {
                          setConsentAccepted(event.target.checked);
                          setStepError(null);
                        }}
                        required
                      />
                      <span>
                        He leído y acepto la{' '}
                        <Link to="/legal/politica-privacidad" target="_blank" rel="noreferrer">
                          política de privacidad
                        </Link>{' '}
                        y consiento el tratamiento de mis datos para gestionar esta solicitud.
                      </span>
                    </label>
                  </section>
                </>
              )}
            </div>

            {stepError && (
              <p className={styles.errorText} role="alert" aria-live="assertive">
                {stepError}
              </p>
            )}

            {submitError && currentStep === 4 && (
              <p className={styles.errorText} role="alert" aria-live="assertive">
                {submitError}
              </p>
            )}

            {currentStep === 4 && (
              <div className={styles.legalNotice} role="note" aria-label="Aviso importante">
                <p className={styles.legalNoticeLabel}>Aviso importante</p>
                <p>
                  Esta solicitud no es una reserva en firme. Comprobaremos la disponibilidad y te
                  contactaremos para confirmar todos los detalles antes de cerrarla.
                </p>
              </div>
            )}

            <div className={styles.stepActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
              >
                Anterior
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleNextStep}
                >
                  Siguiente
                </button>
              ) : (
                <button type="submit" className={styles.primaryButton} disabled={isSending}>
                  {isSending ? 'Enviando solicitud…' : 'Enviar solicitud'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
