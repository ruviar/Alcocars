import { describe, expect, it } from 'vitest';
import { buildQuote } from '../config/catalog';
import { buildBookingAdminEmail, buildBookingCustomerEmail, buildContactEmail } from '../utils/mailer';
import type { BookingEmailPayload } from '../utils/mailer';

const quote = buildQuote({
  tariffId: 'coche-media',
  totalDays: 3,
  plannedKm: 900,
  extras: [{ id: 'babySeat', quantity: 1 }],
});

const payload: BookingEmailPayload = {
  confirmationCode: 'ALC-ABCD2345',
  reservationId: 'res-1',
  client: { firstName: 'Ana', lastName: 'García', email: 'ana@test.es', phone: '+34600000001' },
  quote,
  pickupOffice: { city: 'Zaragoza', address: 'Ctra. de Logroño, km 6,4' },
  returnOffice: { city: 'Tudela', address: 'Av. de Zaragoza, 46' },
  pickupAt: new Date('2026-08-12T08:00:00.000Z'),
  returnAt: new Date('2026-08-15T16:00:00.000Z'),
  notes: 'Llego en el AVE de las 9.',
  needsAvailabilityCheck: false,
};

describe('email de reserva para el equipo', () => {
  const email = buildBookingAdminEmail(payload);

  it('lleva el código y la gama en el asunto para poder buscarlo en el buzón', () => {
    expect(email.subject).toContain('ALC-ABCD2345');
    expect(email.subject).toContain('Coche Gama Media');
    expect(email.subject).toContain('Zaragoza');
  });

  it('incluye los datos de contacto del cliente accionables', () => {
    expect(email.html).toContain('mailto:ana@test.es');
    expect(email.html).toContain('tel:+34600000001');
    expect(email.html).toContain('Ana García');
  });

  it('muestra las horas en hora española, no en UTC', () => {
    expect(email.html).toContain('10:00');
    expect(email.html).toContain('18:00');
  });

  it('desglosa base, km extra, extras y total', () => {
    expect(email.html).toContain('205,00');
    expect(email.html).toContain('60,00');
    expect(email.html).toContain('15,66'); // silla de bebé: 5,22 × 3 días
    expect(email.html).toContain('280,66');
  });

  it('indica la sede de devolución cuando es distinta', () => {
    expect(email.html).toContain('Tudela');
  });

  it('avisa cuando hay que revisar disponibilidad', () => {
    const flagged = buildBookingAdminEmail({ ...payload, needsAvailabilityCheck: true });
    expect(flagged.html).toContain('Revisar disponibilidad');
    expect(email.html).not.toContain('Revisar disponibilidad');
  });

  it('trae versión en texto plano con el desglose', () => {
    expect(email.text).toContain('ALC-ABCD2345');
    expect(email.text).toContain('TOTAL ESTIMADO');
  });
});

describe('email de resguardo para el cliente', () => {
  const email = buildBookingCustomerEmail(payload);

  it('deja claro que no es una reserva confirmada', () => {
    expect(email.html).toContain('no es una reserva confirmada');
    expect(email.html).toContain('24–48 horas');
  });

  it('recuerda los requisitos y la fianza', () => {
    expect(email.html).toContain('25 años');
    expect(email.html).toContain('2 años de antigüedad');
    expect(email.html).toContain('300,00');
  });

  it('saluda por el nombre y muestra el código', () => {
    expect(email.html).toContain('Gracias, Ana');
    expect(email.html).toContain('ALC-ABCD2345');
  });
});

describe('seguridad de las plantillas', () => {
  it('escapa el HTML que envía el usuario', () => {
    const email = buildContactEmail({
      nombre: '<script>alert(1)</script>',
      email: 'x@test.es',
      telefono: '+34600000001',
      mensaje: 'Hola <img src=x onerror=alert(1)>',
    });

    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).not.toContain('<img src=x');
  });

  it('escapa también las observaciones de una reserva', () => {
    const email = buildBookingAdminEmail({ ...payload, notes: '<b>ojo</b>' });
    expect(email.html).toContain('&lt;b&gt;ojo&lt;/b&gt;');
  });
});
