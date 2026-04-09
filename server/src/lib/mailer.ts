import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { clientConfirmationHtml } from './email-templates/clientConfirmation';
import { adminNotificationHtml } from './email-templates/adminNotification';

function createTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null; // SMTP not configured — emails will be skipped
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

// Shape of the reservation object returned by processCheckout (with includes)
type ReservationWithIncludes = {
  confirmationCode: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  estimatedKm: number;
  includedKm: number;
  extraKm: number;
  baseRate: { toFixed?: (d: number) => string } | number;
  extraKmCharge: { toFixed?: (d: number) => string } | number;
  extrasTotal: { toFixed?: (d: number) => string } | number;
  totalAmount: { toFixed?: (d: number) => string } | number;
  depositHeld: { toFixed?: (d: number) => string } | number;
  franchiseAmount: { toFixed?: (d: number) => string } | number;
  category: { name: string; slug: string };
  office: { city: string; address: string; phone: string };
  client: { firstName: string; lastName: string; email: string };
};

function toNum(val: unknown): number {
  return typeof val === 'number' ? val : Number(val);
}

function fmt(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export async function sendClientConfirmation(reservation: ReservationWithIncludes): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('[mailer] SMTP not configured — skipping client confirmation email');
    return;
  }

  const html = clientConfirmationHtml({
    confirmationCode: reservation.confirmationCode,
    firstName: reservation.client.firstName,
    lastName: reservation.client.lastName,
    email: reservation.client.email,
    categoryName: reservation.category.name,
    officeName: reservation.office.city,
    officeAddress: reservation.office.address,
    officePhone: reservation.office.phone,
    startDate: fmt(reservation.startDate),
    endDate: fmt(reservation.endDate),
    totalDays: reservation.totalDays,
    estimatedKm: reservation.estimatedKm,
    includedKm: reservation.includedKm,
    extraKm: reservation.extraKm,
    baseRate: toNum(reservation.baseRate),
    extraKmCharge: toNum(reservation.extraKmCharge),
    extrasTotal: toNum(reservation.extrasTotal),
    totalAmount: toNum(reservation.totalAmount),
    deposit: toNum(reservation.depositHeld),
    franchise: toNum(reservation.franchiseAmount),
  });

  await transporter.sendMail({
    from: env.SMTP_FROM ?? 'noreply@alcocars.es',
    to: reservation.client.email,
    subject: `Confirmación de reserva ${reservation.confirmationCode} — Alcocars`,
    html,
  });
}

export async function sendAdminNotification(reservation: ReservationWithIncludes): Promise<void> {
  const transporter = createTransporter();
  if (!transporter || !env.ADMIN_NOTIFICATION_EMAIL) {
    console.log('[mailer] SMTP or ADMIN_NOTIFICATION_EMAIL not configured — skipping admin notification');
    return;
  }

  const html = adminNotificationHtml({
    confirmationCode: reservation.confirmationCode,
    clientFirstName: reservation.client.firstName,
    clientLastName: reservation.client.lastName,
    clientEmail: reservation.client.email,
    categoryName: reservation.category.name,
    officeName: reservation.office.city,
    startDate: fmt(reservation.startDate),
    endDate: fmt(reservation.endDate),
    totalDays: reservation.totalDays,
    estimatedKm: reservation.estimatedKm,
    totalAmount: toNum(reservation.totalAmount),
  });

  await transporter.sendMail({
    from: env.SMTP_FROM ?? 'noreply@alcocars.es',
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject: `Nueva reserva ${reservation.confirmationCode} — Alcocars Admin`,
    html,
  });
}
