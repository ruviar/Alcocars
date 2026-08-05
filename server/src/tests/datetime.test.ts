import { describe, expect, it } from 'vitest';
import { calendarDaysBetween, isoDateOnly, madridDateTimeToUtc } from '../utils/datetime';

describe('madridDateTimeToUtc', () => {
  it('convierte hora de verano (CEST, UTC+2)', () => {
    // 12 de agosto a las 10:00 en Madrid = 08:00 UTC
    expect(madridDateTimeToUtc('2026-08-12', '10:00').toISOString()).toBe('2026-08-12T08:00:00.000Z');
  });

  it('convierte hora de invierno (CET, UTC+1)', () => {
    // 12 de enero a las 10:00 en Madrid = 09:00 UTC
    expect(madridDateTimeToUtc('2026-01-12', '10:00').toISOString()).toBe('2026-01-12T09:00:00.000Z');
  });

  it('resuelve el día del cambio de hora de primavera', () => {
    // El 29/03/2026 a las 02:00 los relojes pasan a las 03:00.
    expect(madridDateTimeToUtc('2026-03-29', '10:00').toISOString()).toBe('2026-03-29T08:00:00.000Z');
    expect(madridDateTimeToUtc('2026-03-28', '10:00').toISOString()).toBe('2026-03-28T09:00:00.000Z');
  });

  it('resuelve el día del cambio de hora de otoño', () => {
    // El 25/10/2026 a las 03:00 los relojes vuelven a las 02:00.
    expect(madridDateTimeToUtc('2026-10-25', '10:00').toISOString()).toBe('2026-10-25T09:00:00.000Z');
    expect(madridDateTimeToUtc('2026-10-24', '10:00').toISOString()).toBe('2026-10-24T08:00:00.000Z');
  });

  it('rechaza formatos inválidos', () => {
    expect(() => madridDateTimeToUtc('12-08-2026', '10:00')).toThrow();
    expect(() => madridDateTimeToUtc('2026-08-12', '10h')).toThrow();
  });
});

describe('isoDateOnly / calendarDaysBetween', () => {
  it('guarda la fecha civil sin desplazamiento', () => {
    expect(isoDateOnly('2026-08-12').toISOString()).toBe('2026-08-12T00:00:00.000Z');
  });

  it('cuenta días naturales', () => {
    expect(calendarDaysBetween('2026-08-12', '2026-08-15')).toBe(3);
    expect(calendarDaysBetween('2026-08-12', '2026-08-12')).toBe(0);
  });

  it('cuenta bien cruzando el cambio de hora', () => {
    expect(calendarDaysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(calendarDaysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});
