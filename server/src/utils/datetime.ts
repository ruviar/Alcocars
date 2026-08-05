/**
 * Conversión de fecha + hora locales (Europe/Madrid) a instante UTC.
 *
 * El cliente elige «12 de agosto a las 10:00» pensando en hora española. Si se
 * guardase con `new Date('2026-08-12T10:00')` el resultado dependería de la zona
 * del servidor (Railway corre en UTC), y el email mostraría 12:00 en lugar de
 * 10:00. Aquí se resuelve el desplazamiento real de Madrid en esa fecha, con
 * cambio de hora incluido.
 */

const MADRID = 'Europe/Madrid';

const PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: MADRID,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Desplazamiento de Madrid respecto a UTC, en ms, para un instante dado. */
function madridOffsetMs(instant: Date): number {
  const parts = PARTS_FORMATTER.formatToParts(instant);
  const lookup = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  // `hour` puede venir como 24 a medianoche en algunos runtimes.
  const hour = lookup('hour') % 24;

  const asUtc = Date.UTC(
    lookup('year'),
    lookup('month') - 1,
    lookup('day'),
    hour,
    lookup('minute'),
    lookup('second'),
  );

  return asUtc - instant.getTime();
}

/**
 * Convierte `YYYY-MM-DD` + `HH:mm` en hora de Madrid al `Date` (UTC) correcto.
 * Lanza si el formato no es válido.
 */
export function madridDateTimeToUtc(dateIso: string, timeIso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) throw new Error(`Fecha inválida: ${dateIso}`);
  if (!/^\d{2}:\d{2}$/.test(timeIso)) throw new Error(`Hora inválida: ${timeIso}`);

  const naive = new Date(`${dateIso}T${timeIso}:00.000Z`);
  if (Number.isNaN(naive.getTime())) throw new Error(`Fecha/hora inválida: ${dateIso} ${timeIso}`);

  // Primera aproximación con el desplazamiento del instante ingenuo y una
  // segunda pasada para los casos que caen justo en el cambio de hora.
  let utc = new Date(naive.getTime() - madridOffsetMs(naive));
  utc = new Date(naive.getTime() - madridOffsetMs(utc));

  return utc;
}

/** `YYYY-MM-DD` como fecha civil pura, para columnas `@db.Date`. */
export function isoDateOnly(dateIso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) throw new Error(`Fecha inválida: ${dateIso}`);
  return new Date(`${dateIso}T00:00:00.000Z`);
}

/** Días naturales entre dos fechas `YYYY-MM-DD`. */
export function calendarDaysBetween(startIso: string, endIso: string): number {
  const start = isoDateOnly(startIso).getTime();
  const end = isoDateOnly(endIso).getTime();
  return Math.round((end - start) / 86_400_000);
}
