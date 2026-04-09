import { describe, it, expect } from 'vitest';
import { computePrice, type CategoryRates } from '../lib/pricing';

const basicCar: CategoryRates = {
  price1Day: 61, price2Day: 118, price3Day: 154, price4Day: 180,
  price5Day: 205, price6Day: 224, price7Day: 255,
  extraKmRate: 0.15, deposit: 300, franchise: 300,
};

const suv: CategoryRates = {
  price1Day: 205, price2Day: 340, price3Day: 468, price4Day: 590,
  price5Day: 766, price6Day: 808, price7Day: 850,
  extraKmRate: 0.27, deposit: 600, franchise: 600,
};

describe('computePrice', () => {
  it('caso 1: 1 día / 150 km — dentro del incluido, sin extra km', () => {
    const result = computePrice({ category: basicCar, days: 1, estimatedKm: 150, extrasTotal: 0 });
    expect(result.baseRate).toBe(61);
    expect(result.extraKm).toBe(0);
    expect(result.extraKmCharge).toBe(0);
    expect(result.totalAmount).toBe(61);
  });

  it('caso 2: 3 días / 600 km exacto — km incluidos exactos, sin extra', () => {
    const result = computePrice({ category: basicCar, days: 3, estimatedKm: 600, extrasTotal: 0 });
    expect(result.baseRate).toBe(154);
    expect(result.includedKm).toBe(600);
    expect(result.extraKm).toBe(0);
    expect(result.totalAmount).toBe(154);
  });

  it('caso 3: 5 días / 1200 km — 200 km extra sobre 1000 incluidos', () => {
    const result = computePrice({ category: basicCar, days: 5, estimatedKm: 1200, extrasTotal: 0 });
    expect(result.baseRate).toBe(205);
    expect(result.includedKm).toBe(1000);
    expect(result.extraKm).toBe(200);
    expect(result.extraKmCharge).toBe(30.00);
    expect(result.totalAmount).toBe(235);
  });

  it('caso 4: 7 días / 2000 km — 600 km extra sobre 1400 incluidos', () => {
    const result = computePrice({ category: basicCar, days: 7, estimatedKm: 2000, extrasTotal: 0 });
    expect(result.baseRate).toBe(255);
    expect(result.includedKm).toBe(1400);
    expect(result.extraKm).toBe(600);
    expect(result.extraKmCharge).toBe(90.00);
    expect(result.totalAmount).toBe(345);
  });

  it('caso 5: con extras — 3 días / 400 km + extrasTotal 50', () => {
    const result = computePrice({ category: basicCar, days: 3, estimatedKm: 400, extrasTotal: 50 });
    expect(result.baseRate).toBe(154);
    expect(result.extraKm).toBe(0);
    expect(result.extrasTotal).toBe(50);
    expect(result.totalAmount).toBe(204);
  });

  it('caso 6: 0 días → lanza INVALID_DAY_RANGE', () => {
    expect(() =>
      computePrice({ category: basicCar, days: 0, estimatedKm: 100, extrasTotal: 0 })
    ).toThrow('INVALID_DAY_RANGE');
  });

  it('caso 7: 8 días → lanza INVALID_DAY_RANGE', () => {
    expect(() =>
      computePrice({ category: basicCar, days: 8, estimatedKm: 100, extrasTotal: 0 })
    ).toThrow('INVALID_DAY_RANGE');
  });

  it('caso 8: km=0 → lanza INVALID_KM', () => {
    expect(() =>
      computePrice({ category: basicCar, days: 1, estimatedKm: 0, extrasTotal: 0 })
    ).toThrow('INVALID_KM');
  });

  it('caso 9: km=-1 → lanza INVALID_KM', () => {
    expect(() =>
      computePrice({ category: basicCar, days: 1, estimatedKm: -1, extrasTotal: 0 })
    ).toThrow('INVALID_KM');
  });

  it('caso 10: Todoterreno Largo — 3 días / 700 km, 100 km extra a 0.27', () => {
    const result = computePrice({ category: suv, days: 3, estimatedKm: 700, extrasTotal: 0 });
    expect(result.baseRate).toBe(468);
    expect(result.includedKm).toBe(600);
    expect(result.extraKm).toBe(100);
    expect(result.extraKmCharge).toBe(27.00);
    expect(result.totalAmount).toBe(495);
  });
});
