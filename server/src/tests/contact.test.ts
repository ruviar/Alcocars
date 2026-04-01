import { describe, it, expect } from 'vitest';
import { contactBodySchema } from '../modules/contact/contact.schema';

describe('contactBodySchema', () => {
  it('accepts valid contact form data', () => {
    const result = contactBodySchema.safeParse({
      nombre: 'Ana García',
      email: 'ana@test.es',
      telefono: '+34600000001',
      mensaje: 'Hola, necesito información.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = contactBodySchema.safeParse({
      nombre: 'Ana',
      email: 'not-an-email',
      telefono: '+34600000001',
      mensaje: 'Hola',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty mensaje', () => {
    const result = contactBodySchema.safeParse({
      nombre: 'Ana',
      email: 'ana@test.es',
      telefono: '+34600000001',
      mensaje: '',
    });
    expect(result.success).toBe(false);
  });
});
