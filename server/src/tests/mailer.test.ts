import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';

vi.mock('nodemailer');
vi.mock('../config/env', () => ({
  env: {
    SMTP_HOST: 'smtp.test.com',
    SMTP_PORT: 587,
    SMTP_USER: 'user@test.com',
    SMTP_PASS: 'secret',
    SMTP_FROM: 'noreply@alcocars.es',
    ADMIN_NOTIFICATION_EMAIL: 'admin@test.com',
  },
}));

const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test' });
vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMail } as any);

const mockReservation = {
  confirmationCode: 'ALC-001',
  startDate: new Date('2026-06-01'),
  endDate: new Date('2026-06-04'),
  totalDays: 3,
  estimatedKm: 800,
  includedKm: 600,
  extraKm: 200,
  baseRate: 154,
  extraKmCharge: 30,
  extrasTotal: 0,
  totalAmount: 184,
  depositHeld: 300,
  franchiseAmount: 300,
  category: { name: 'Coche Gama básica', slug: 'coche-gama-basica' },
  office: { city: 'Zaragoza', address: 'Calle Mayor 1', phone: '976000000' },
  client: { firstName: 'Ana', lastName: 'López', email: 'ana@test.com' },
};

describe('mailer', () => {
  beforeEach(() => mockSendMail.mockClear());

  it('sendClientConfirmation calls sendMail with client email and confirmationCode in html', async () => {
    const { sendClientConfirmation } = await import('../lib/mailer');
    await sendClientConfirmation(mockReservation as any);
    expect(mockSendMail).toHaveBeenCalledOnce();
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('ana@test.com');
    expect(call.html).toContain('ALC-001');
  });

  it('sendAdminNotification calls sendMail to ADMIN_NOTIFICATION_EMAIL', async () => {
    const { sendAdminNotification } = await import('../lib/mailer');
    await sendAdminNotification(mockReservation as any);
    expect(mockSendMail).toHaveBeenCalledOnce();
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('admin@test.com');
    expect(call.html).toContain('ALC-001');
  });

  it('sendClientConfirmation includes correct subject with confirmationCode', async () => {
    const { sendClientConfirmation } = await import('../lib/mailer');
    await sendClientConfirmation(mockReservation as any);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain('ALC-001');
  });

  it('sendAdminNotification includes correct subject with confirmationCode', async () => {
    const { sendAdminNotification } = await import('../lib/mailer');
    await sendAdminNotification(mockReservation as any);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain('ALC-001');
  });

  it('skips sending when SMTP not configured', async () => {
    // When SMTP_HOST is missing createTransport should not be called
    // We verify this by checking that if nodemailer.createTransport returns null
    // the function does not throw and sendMail is not called
    vi.mocked(nodemailer.createTransport).mockReturnValueOnce(null as any);
    // Re-import is not needed — createTransporter() checks env.SMTP_HOST at call time
    // For this test we temporarily patch the env mock to omit SMTP_HOST
    // Instead we verify the no-transporter branch: mock createTransport to return null
    // and confirm sendMail is never called (since mailer.ts checks `if (!transporter)`)
    // NOTE: because env is already mocked with SMTP_HOST set, createTransporter() will
    // call nodemailer.createTransport — we intercept its return value as null here.
    const { sendClientConfirmation } = await import('../lib/mailer');
    await expect(sendClientConfirmation(mockReservation as any)).resolves.toBeUndefined();
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
