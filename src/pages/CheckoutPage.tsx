import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { addDays, format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocation, useNavigate } from 'react-router-dom';
import { SUPER_CATEGORIES, tariffs, type SuperCategory, type TariffEntry } from '../data/tariffs';
import { api } from '../lib/api';
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
  email: string;
  telefono: string;
  observaciones: string;
};

const STEP_META: Record<StepNumber, { short: string; title: string; description: string }> = {
  1: {
    short: 'Fechas',
    title: 'Fechas y Ubicacion',
    description: 'Define recogida, devolucion, horarios y kilometraje previsto.',
  },
  2: {
    short: 'Vehiculo',
    title: 'Tipo de Vehiculo',
    description: 'Confirma la gama de la flota o cambiala segun tu necesidad.',
  },
  3: {
    short: 'Extras',
    title: 'Extras',
    description: 'Selecciona los servicios adicionales para personalizar la solicitud.',
  },
  4: {
    short: 'Resumen',
    title: 'Resumen y Datos Personales',
    description: 'Revisa el desglose final y deja tus datos para que te contactemos.',
  },
};

const LOCATION_OPTIONS = ['Zaragoza', 'Tudela', 'Soria'] as const;

const EXTRA_OPTIONS = [
  {
    id: 'cityAfterHoursOffice',
    label: 'Entregas y recogidas (en oficinas de ciudad fuera del horario laboral)',
    price: 25,
  },
  {
    id: 'cityOutsideOffice',
    label: 'Entregas y recogidas (en hoteles, Renfe, estaciones maritimas y en general fuera de oficinas de ciudad)',
    price: 40,
  },
  {
    id: 'airportBusinessHours',
    label: 'Entregas y recogidas (en Aeropuertos durante el horario laboral)',
    price: 40,
  },
  {
    id: 'differentOfficeReturn',
    label: 'Entrega del vehiculo en una oficina de Alcocars diferente a donde se recogio',
    price: 69.6,
  },
  {
    id: 'skiRackChains',
    label: 'Porta esquies/cadenas',
    price: 34.8,
  },
  {
    id: 'additionalDriver',
    label: 'Conductor adicional',
    price: 8,
  },
] as const;

type ExtraId = (typeof EXTRA_OPTIONS)[number]['id'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function buildInitialExtrasState(): Record<ExtraId, boolean> {
  return EXTRA_OPTIONS.reduce((acc, extra) => {
    acc[extra.id] = false;
    return acc;
  }, {} as Record<ExtraId, boolean>);
}

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

function getTotalDays(startIso: string, endIso: string): number {
  if (!startIso || !endIso) {
    return 0;
  }

  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const difference = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return difference > 0 ? difference : 0;
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

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [pickupDate, setPickupDate] = useState<string>(() => toIsoDate(initialFromDate));
  const [returnDate, setReturnDate] = useState<string>(() => toIsoDate(initialToDate));
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnTime, setReturnTime] = useState('18:00');
  const [pickupLocation, setPickupLocation] = useState<string>(bookingState?.location ?? 'Zaragoza');
  const [returnLocation, setReturnLocation] = useState<string>(bookingState?.location ?? 'Zaragoza');
  const [plannedKmInput, setPlannedKmInput] = useState('200');
  const [selectedTariffId, setSelectedTariffId] = useState<string>(() => resolveInitialTariffId(bookingState));
  const [selectedExtras, setSelectedExtras] = useState<Record<ExtraId, boolean>>(() => buildInitialExtrasState());
  const [personalData, setPersonalData] = useState<PersonalData>({
    nombre: '',
    email: '',
    telefono: '',
    observaciones: '',
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!pickupDate || !returnDate || returnDate > pickupDate) {
      return;
    }

    const nextReturnDate = addDays(new Date(`${pickupDate}T00:00:00`), 1);
    setReturnDate(toIsoDate(nextReturnDate));
  }, [pickupDate, returnDate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const selectedTariff = useMemo(
    () => tariffs.find((tariff) => tariff.id === selectedTariffId) ?? null,
    [selectedTariffId],
  );

  const totalDays = useMemo(
    () => getTotalDays(pickupDate, returnDate),
    [pickupDate, returnDate],
  );

  const plannedKm = Number.parseInt(plannedKmInput, 10);
  const isPlannedKmValid = Number.isFinite(plannedKm) && plannedKm > 0;
  const includedKm = selectedTariff ? selectedTariff.kmPerDay * totalDays : 0;
  const extraKm = Math.max((isPlannedKmValid ? plannedKm : 0) - includedKm, 0);
  const extraKmSurcharge = selectedTariff ? roundCurrency(extraKm * selectedTariff.kmExtra) : 0;
  const baseTariffPrice = selectedTariff ? getBaseTariffPrice(selectedTariff, totalDays) : 0;

  const selectedExtrasList = useMemo(
    () => EXTRA_OPTIONS.filter((extra) => selectedExtras[extra.id]),
    [selectedExtras],
  );

  const extrasTotal = useMemo(
    () => roundCurrency(selectedExtrasList.reduce((sum, extra) => sum + extra.price, 0)),
    [selectedExtrasList],
  );

  const finalTotal = baseTariffPrice === null
    ? null
    : roundCurrency(baseTariffPrice + extraKmSurcharge + extrasTotal);

  const isDateRangeValid = pickupDate.length > 0 && returnDate.length > 0 && returnDate > pickupDate;
  const isStep1Valid = Boolean(
    pickupLocation
    && returnLocation
    && pickupTime
    && returnTime
    && isDateRangeValid
    && isPlannedKmValid,
  );
  const isStep2Valid = Boolean(selectedTariffId);
  const isEmailValid = EMAIL_PATTERN.test(personalData.email.trim());
  const isPhoneValid = personalData.telefono.trim().length >= 6;
  const isStep4Valid = personalData.nombre.trim().length > 0 && isEmailValid && isPhoneValid;

  const progressPercentage = ((currentStep - 1) / 3) * 100;

  const reservationMessage = useMemo(() => {
    const extrasLines = selectedExtrasList.length > 0
      ? selectedExtrasList.map((extra) => `- ${extra.label}: ${formatCurrency(extra.price)}`).join('\n')
      : '- Ninguno';

    const basePriceLabel = selectedTariff
      ? (baseTariffPrice === null ? 'Precio base bajo consulta' : formatCurrency(baseTariffPrice))
      : 'Sin gama seleccionada';

    const totalLabel = finalTotal === null ? 'A consultar' : formatCurrency(finalTotal);

    return [
      'Solicitud de reserva web (wizard)',
      '',
      'RECUERDE QUE NO ES UNA RESERVA FORMAL. CONTACTAREMOS CON USTED PARA CONCRETAR LOS DETALLES',
      '',
      `Fechas: ${formatHumanDate(pickupDate)} ${pickupTime} -> ${formatHumanDate(returnDate)} ${returnTime}`,
      `Recogida: ${pickupLocation}`,
      `Devolucion: ${returnLocation}`,
      `Gama: ${selectedTariff?.name ?? 'Sin seleccionar'}`,
      `Categoria: ${selectedTariff?.superCategory ?? '-'}`,
      `Dias: ${totalDays}`,
      `Kilometraje previsto: ${isPlannedKmValid ? plannedKm : 0} km`,
      `Kilometros incluidos: ${includedKm} km`,
      `Kilometros extra: ${extraKm} km`,
      '',
      'Extras seleccionados:',
      extrasLines,
      '',
      `Tarifa base: ${basePriceLabel}`,
      `Sobrecoste km extra: ${formatCurrency(extraKmSurcharge)}`,
      `Total extras: ${formatCurrency(extrasTotal)}`,
      `Total estimado: ${totalLabel}`,
      '',
      `Observaciones cliente: ${personalData.observaciones.trim() || 'Sin observaciones.'}`,
    ].join('\n');
  }, [
    selectedExtrasList,
    selectedTariff,
    baseTariffPrice,
    finalTotal,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    pickupLocation,
    returnLocation,
    totalDays,
    isPlannedKmValid,
    plannedKm,
    includedKm,
    extraKm,
    extraKmSurcharge,
    extrasTotal,
    personalData.observaciones,
  ]);

  const handleNextStep = () => {
    if (currentStep === 1 && !isStep1Valid) {
      setStepError('Completa fechas, horarios, ubicaciones y kilometraje valido para continuar.');
      return;
    }

    if (currentStep === 2 && !isStep2Valid) {
      setStepError('Selecciona una gama de vehiculo para continuar.');
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

  const handleToggleExtra = (extraId: ExtraId) => {
    setSelectedExtras((prev) => ({
      ...prev,
      [extraId]: !prev[extraId],
    }));
    setStepError(null);
  };

  const handlePersonalDataChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    if (name === 'nombre' || name === 'email' || name === 'telefono' || name === 'observaciones') {
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
      setStepError('Revisa los datos del Paso 1 antes de enviar.');
      return;
    }

    if (!isStep2Valid) {
      setCurrentStep(2);
      setStepError('Selecciona una gama en el Paso 2 antes de enviar.');
      return;
    }

    if (!isStep4Valid) {
      setStepError('Completa nombre, email valido y telefono para enviar la solicitud.');
      return;
    }

    setIsSending(true);
    setSubmitError(null);

    try {
      await api.post<{ ok: true }>('/api/contact', {
        nombre: personalData.nombre.trim(),
        email: personalData.email.trim(),
        telefono: personalData.telefono.trim(),
        mensaje: reservationMessage,
      });

      setIsSuccess(true);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.');
    } finally {
      setIsSending(false);
    }
  };

  if (isSuccess) {
    return (
      <main className={styles.page}>
        <div className={styles.layout}>
          <section className={styles.successCard} aria-live="polite">
            <p className={styles.kicker}>Solicitud enviada</p>
            <h1 className={styles.successTitle}>Gracias, te contactamos pronto</h1>
            <p className={styles.successText}>
              Tu solicitud se ha enviado correctamente. Nuestro equipo revisara la disponibilidad y
              te contactara para concretar todos los detalles de la reserva.
            </p>

            <div className={styles.successSummary}>
              <p>
                <span>Gama elegida</span>
                <strong>{selectedTariff?.name ?? 'Sin seleccionar'}</strong>
              </p>
              <p>
                <span>Fechas</span>
                <strong>{formatHumanDate(pickupDate)} - {formatHumanDate(returnDate)}</strong>
              </p>
              <p>
                <span>Total estimado</span>
                <strong>{finalTotal === null ? 'A consultar' : formatCurrency(finalTotal)}</strong>
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
          <h1 className={styles.title}>WIZARD DE RESERVA</h1>
          <p className={styles.subtitle}>
            Completa cada paso en orden para enviar una solicitud clara y sin friccion.
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
                  <div className={styles.fieldGridTwo}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Dia de recogida</span>
                      <input
                        className={styles.inputControl}
                        type="date"
                        value={pickupDate}
                        min={toIsoDate(today)}
                        onChange={(event) => {
                          setPickupDate(event.target.value);
                          setStepError(null);
                        }}
                        required
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Dia de devolucion</span>
                      <input
                        className={styles.inputControl}
                        type="date"
                        value={returnDate}
                        min={pickupDate || toIsoDate(today)}
                        onChange={(event) => {
                          setReturnDate(event.target.value);
                          setStepError(null);
                        }}
                        required
                      />
                    </label>
                  </div>

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
                      <span className={styles.fieldLabel}>Hora de devolucion</span>
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
                      <span className={styles.fieldLabel}>Lugar de recogida</span>
                      <select
                        className={styles.selectControl}
                        value={pickupLocation}
                        onChange={(event) => {
                          setPickupLocation(event.target.value);
                          setStepError(null);
                        }}
                      >
                        {LOCATION_OPTIONS.map((location) => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Lugar de devolucion</span>
                      <select
                        className={styles.selectControl}
                        value={returnLocation}
                        onChange={(event) => {
                          setReturnLocation(event.target.value);
                          setStepError(null);
                        }}
                      >
                        {LOCATION_OPTIONS.map((location) => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className={styles.fieldGridOne}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Kilometraje total previsto a realizar</span>
                      <input
                        className={styles.inputControl}
                        type="number"
                        min={1}
                        step={1}
                        value={plannedKmInput}
                        onChange={(event) => {
                          setPlannedKmInput(event.target.value);
                          setStepError(null);
                        }}
                        required
                      />
                    </label>
                  </div>

                  <div className={styles.legalNotice} role="note" aria-label="Aviso legal importante">
                    <p className={styles.legalNoticeLabel}>Aviso legal importante</p>
                    <p>
                      RECUERDE QUE NO ES UNA RESERVA FORMAL. CONTACTAREMOS CON USTED PARA CONCRETAR LOS DETALLES
                    </p>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <div className={styles.vehicleGroups}>
                  {SUPER_CATEGORIES.map((category) => {
                    const categoryTariffs = tariffs.filter((tariff) => tariff.superCategory === category);

                    return (
                      <section key={category} className={styles.vehicleGroup}>
                        <h3 className={styles.vehicleGroupTitle}>{category}</h3>

                        <div className={styles.vehicleList}>
                          {categoryTariffs.map((tariff) => {
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
                                      {tariff.kmPerDay} km/dia incluidos · {tariff.kmExtra.toFixed(2).replace('.', ',')} €/km extra
                                    </p>
                                  </div>
                                </div>

                                <p className={styles.vehiclePrice}>
                                  {tariff.consultOnly
                                    ? 'Tarifa base bajo consulta'
                                    : `${formatCurrency(tariff.rates[0] ?? 0)} / dia`}
                                </p>
                              </label>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}

              {currentStep === 3 && (
                <>
                  <div className={styles.extrasList}>
                    {EXTRA_OPTIONS.map((extra) => (
                      <label key={extra.id} className={styles.extraItem}>
                        <input
                          className={styles.extraCheckbox}
                          type="checkbox"
                          checked={selectedExtras[extra.id]}
                          onChange={() => handleToggleExtra(extra.id)}
                        />
                        <div className={styles.extraBody}>
                          <span className={styles.extraLabel}>{extra.label}</span>
                          <strong className={styles.extraPrice}>{formatCurrency(extra.price)}</strong>
                        </div>
                      </label>
                    ))}
                  </div>

                  <p className={styles.helperText}>
                    Los importes de extras se suman de forma automatica al total estimado del paso final.
                  </p>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <section className={styles.summaryPanel}>
                    <h3 className={styles.summaryTitle}>Desglose dinamico</h3>

                    <ul className={styles.summaryList}>
                      <li className={styles.summaryListItem}>
                        <span className={styles.summaryLabel}>Tarifa base ({totalDays} dia{totalDays === 1 ? '' : 's'})</span>
                        <strong className={styles.summaryValue}>
                          {selectedTariff
                            ? (baseTariffPrice === null ? 'A consultar' : formatCurrency(baseTariffPrice))
                            : '--'}
                        </strong>
                      </li>

                      <li className={styles.summaryListItem}>
                        <span className={styles.summaryLabel}>Sobrecoste por km extra ({extraKm} km)</span>
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
                      Incluidos: {includedKm} km. Si superas este valor, se aplica {selectedTariff ? `${selectedTariff.kmExtra.toFixed(2).replace('.', ',')} €/km` : '--'}.
                    </p>

                    <div className={styles.extrasSummaryList}>
                      {selectedExtrasList.length === 0 && (
                        <p className={styles.emptyExtras}>No has seleccionado extras.</p>
                      )}

                      {selectedExtrasList.map((extra) => (
                        <p key={extra.id}>
                          <span>{extra.label}</span>
                          <strong>{formatCurrency(extra.price)}</strong>
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
                          placeholder="Nombre y apellidos"
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Telefono</span>
                        <input
                          className={styles.inputControl}
                          type="tel"
                          name="telefono"
                          value={personalData.telefono}
                          onChange={handlePersonalDataChange}
                          placeholder="+34 600 000 000"
                          required
                        />
                      </label>
                    </div>

                    <div className={styles.fieldGridOne}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Email</span>
                        <input
                          className={styles.inputControl}
                          type="email"
                          name="email"
                          value={personalData.email}
                          onChange={handlePersonalDataChange}
                          placeholder="tu@email.com"
                          required
                        />
                      </label>

                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Observaciones</span>
                        <textarea
                          className={styles.textareaControl}
                          name="observaciones"
                          value={personalData.observaciones}
                          onChange={handlePersonalDataChange}
                          placeholder="Escribe cualquier detalle extra para preparar tu solicitud"
                          rows={4}
                        />
                      </label>
                    </div>
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
                  {isSending ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                </button>
              )}
            </div>
          </form>

          <aside className={styles.summaryCard} aria-label="Resumen rapido de la solicitud">
            <h2 className={styles.summaryTitle}>Resumen rapido</h2>

            <ul className={styles.summaryList}>
              <li className={styles.summaryListItem}>
                <span className={styles.summaryLabel}>Fechas</span>
                <strong className={styles.summaryValue}>{formatHumanDate(pickupDate)} - {formatHumanDate(returnDate)}</strong>
              </li>
              <li className={styles.summaryListItem}>
                <span className={styles.summaryLabel}>Ubicaciones</span>
                <strong className={styles.summaryValue}>{pickupLocation} → {returnLocation}</strong>
              </li>
              <li className={styles.summaryListItem}>
                <span className={styles.summaryLabel}>Gama</span>
                <strong className={styles.summaryValue}>{selectedTariff?.name ?? '--'}</strong>
              </li>
              <li className={styles.summaryListItem}>
                <span className={styles.summaryLabel}>Kilometraje previsto</span>
                <strong className={styles.summaryValue}>{isPlannedKmValid ? `${plannedKm} km` : '--'}</strong>
              </li>
              <li className={`${styles.summaryListItem} ${styles.summaryListTotal}`}>
                <span className={styles.summaryLabel}>Total estimado</span>
                <strong className={styles.summaryValue}>{finalTotal === null ? 'A consultar' : formatCurrency(finalTotal)}</strong>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}