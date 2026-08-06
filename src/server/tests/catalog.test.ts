import { describe, expect, it } from 'vitest';
import { EXTRAS, QuoteError, buildQuote, getBaseRate, getTariff } from '../config/catalog';

describe('getBaseRate', () => {
  it('usa la tarifa publicada para 1..7 días', () => {
    const tariff = getTariff('coche-basica')!;
    expect(getBaseRate(tariff, 1)).toBe(61);
    expect(getBaseRate(tariff, 4)).toBe(180);
    expect(getBaseRate(tariff, 7)).toBe(255);
  });

  it('extrapola por semanas completas más el resto por encima de 7 días', () => {
    const tariff = getTariff('coche-basica')!;
    // 10 días = 1 semana (255) + 3 días (154)
    expect(getBaseRate(tariff, 10)).toBe(409);
    // 14 días = 2 semanas exactas
    expect(getBaseRate(tariff, 14)).toBe(510);
  });

  it('devuelve null en las gamas bajo consulta', () => {
    expect(getBaseRate(getTariff('autocaravana')!, 3)).toBeNull();
  });
});

describe('buildQuote', () => {
  it('calcula base, km incluidos y recargo por km extra', () => {
    const quote = buildQuote({ tariffId: 'coche-media', totalDays: 3, plannedKm: 900, extras: [] });

    expect(quote.baseTotal).toBe(205);
    expect(quote.includedKm).toBe(600);
    expect(quote.extraKm).toBe(300);
    expect(quote.extraKmRate).toBe(0.2);
    expect(quote.extraKmSurcharge).toBe(60);
    expect(quote.totalAmount).toBe(265);
  });

  it('no cobra km extra si el kilometraje previsto entra en el incluido', () => {
    const quote = buildQuote({ tariffId: 'coche-media', totalDays: 3, plannedKm: 400, extras: [] });
    expect(quote.extraKm).toBe(0);
    expect(quote.extraKmSurcharge).toBe(0);
    expect(quote.totalAmount).toBe(205);
  });

  it('cobra los extras por alquiler una sola vez', () => {
    const quote = buildQuote({
      tariffId: 'coche-basica',
      totalDays: 5,
      plannedKm: 1000,
      extras: [{ id: 'skiRackChains', quantity: 1 }],
    });

    expect(quote.extrasTotal).toBe(34.8);
    expect(quote.totalAmount).toBe(239.8);
  });

  it('cobra los extras por día multiplicando por los días', () => {
    const quote = buildQuote({
      tariffId: 'coche-basica',
      totalDays: 4,
      plannedKm: 800,
      extras: [{ id: 'babySeat', quantity: 1 }],
    });

    // 5,22 €/día × 4 días
    expect(quote.extrasTotal).toBe(20.88);
  });

  it('aplica el tope máximo por alquiler de la silla de bebé', () => {
    const quote = buildQuote({
      tariffId: 'coche-basica',
      totalDays: 30,
      plannedKm: 6000,
      extras: [{ id: 'babySeat', quantity: 1 }],
    });

    // 5,22 × 30 = 156,60 € → se limita al máximo publicado
    expect(quote.extrasTotal).toBe(46.4);
  });

  it('escala el tope con la cantidad de sillas', () => {
    const quote = buildQuote({
      tariffId: 'coche-basica',
      totalDays: 30,
      plannedKm: 6000,
      extras: [{ id: 'babySeat', quantity: 2 }],
    });

    expect(quote.extrasTotal).toBe(92.8);
  });

  it('deja el total en null cuando la gama es bajo consulta pero mantiene los extras', () => {
    const quote = buildQuote({
      tariffId: 'autocaravana',
      totalDays: 5,
      plannedKm: 1500,
      extras: [{ id: 'additionalDriver', quantity: 1 }],
    });

    expect(quote.baseTotal).toBeNull();
    expect(quote.totalAmount).toBeNull();
    expect(quote.extrasTotal).toBe(8);
  });

  it('rechaza gamas, extras y rangos inválidos', () => {
    expect(() => buildQuote({ tariffId: 'no-existe', totalDays: 2, plannedKm: 100, extras: [] })).toThrow(
      QuoteError,
    );
    expect(() => buildQuote({ tariffId: 'coche-basica', totalDays: 0, plannedKm: 100, extras: [] })).toThrow(
      'INVALID_DATE_RANGE',
    );
    expect(() =>
      buildQuote({ tariffId: 'coche-basica', totalDays: 400, plannedKm: 100, extras: [] }),
    ).toThrow('MAX_RENTAL_DAYS_EXCEEDED');
    expect(() =>
      buildQuote({ tariffId: 'coche-basica', totalDays: 2, plannedKm: 100, extras: [{ id: 'babySeat', quantity: 99 }] }),
    ).toThrow('INVALID_EXTRA_QUANTITY');
  });

  it('congela la etiqueta del extra en el presupuesto', () => {
    const quote = buildQuote({
      tariffId: 'coche-basica',
      totalDays: 1,
      plannedKm: 100,
      extras: [{ id: 'additionalDriver', quantity: 2 }],
    });

    expect(quote.extras[0].label).toBe(EXTRAS.find((extra) => extra.id === 'additionalDriver')!.label);
    expect(quote.extras[0].totalPrice).toBe(16);
  });
});
