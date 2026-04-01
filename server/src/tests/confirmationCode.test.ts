import { describe, it, expect } from 'vitest';
import { generateConfirmationCode } from '../utils/confirmationCode';

describe('generateConfirmationCode', () => {
  it('returns a string matching ALC-XXXXXXXX format', () => {
    const code = generateConfirmationCode();
    expect(code).toMatch(/^ALC-[A-Z2-9]{8}$/);
  });

  it('generates unique codes on repeated calls', () => {
    const codes = new Set(Array.from({ length: 100 }, generateConfirmationCode));
    expect(codes.size).toBe(100);
  });
});
