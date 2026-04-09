import nodemailer from 'nodemailer';
import { env } from '../config/env';

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST ?? 'smtp.gmail.com',
  port: env.SMTP_PORT ?? 587,
  secure: false,
  auth: {
    user: env.SMTP_USER ?? '',
    pass: env.SMTP_PASS ?? '',
  },
});

// ── Contact notification ─────────────────────────────────────────────────────

export interface ContactEmailData {
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
}

export function sendContactNotification(data: ContactEmailData): void {
  if (!isSmtpConfigured()) {
    console.log('[MAILER] SMTP not configured, skipping contact email');
    return;
  }

  transporter
    .sendMail({
      from: env.SMTP_FROM,
      to: env.NOTIFY_EMAIL,
      replyTo: data.email,
      subject: `[Alcocars] Nuevo mensaje de ${data.nombre}`,
      html: contactHtml(data),
    })
    .catch((err) => console.error('[MAILER] contact error:', err));
}

// ── Booking notification ─────────────────────────────────────────────────────

export interface BookingEmailData {
  confirmationCode: string;
  totalAmount: number;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  category: string;
  officeSlug: string;
  startDate: string;
  endDate: string;
  extras: Array<{ key: string; quantity: number }>;
}

export function sendBookingEmails(data: BookingEmailData): void {
  if (!isSmtpConfigured()) {
    console.log('[MAILER] SMTP not configured, skipping booking emails');
    return;
  }

  // Admin notification
  transporter
    .sendMail({
      from: env.SMTP_FROM,
      to: env.NOTIFY_EMAIL,
      subject: `[Alcocars] Nueva solicitud #${data.confirmationCode}`,
      html: adminBookingHtml(data),
    })
    .catch((err) => console.error('[MAILER] admin booking error:', err));

  // Customer receipt
  transporter
    .sendMail({
      from: env.SMTP_FROM,
      to: data.client.email,
      subject: `Solicitud recibida · Alcocars · #${data.confirmationCode}`,
      html: customerReceiptHtml(data),
    })
    .catch((err) => console.error('[MAILER] customer receipt error:', err));
}

// ── HTML templates ───────────────────────────────────────────────────────────

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 12px;font-weight:600;color:#555;white-space:nowrap;width:140px">${label}</td>
      <td style="padding:8px 12px;color:#222">${value}</td>
    </tr>`;
}

const baseStyle = `
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  max-width:580px;margin:0 auto;background:#f5f5f5;padding:24px;
`;

const cardStyle = `
  background:#fff;border-radius:10px;padding:28px 32px;
  box-shadow:0 2px 8px rgba(0,0,0,.08);
`;

function categoryLabel(code: string): string {
  const map: Record<string, string> = {
    TURISMOS: 'Turismos',
    FURGONETAS: 'Furgonetas',
    SUV_4X4: '4×4 / Todoterreno',
    AUTOCARAVANAS: 'Autocaravanas',
  };
  return map[code] ?? code;
}

function extrasLabel(extras: Array<{ key: string; quantity: number }>): string {
  if (extras.length === 0) return 'Ninguno';
  const names: Record<string, string> = {
    BABY_SEAT: 'Silla de bebé',
    SNOW_CHAINS: 'Cadenas de nieve',
    ADDITIONAL_DRIVER: 'Conductor adicional',
  };
  return extras
    .filter((e) => e.quantity > 0)
    .map((e) => `${names[e.key] ?? e.key} ×${e.quantity}`)
    .join(', ') || 'Ninguno';
}

function contactHtml(data: ContactEmailData): string {
  const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  return `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        <h2 style="margin:0 0 4px;font-size:22px;color:#111">Nuevo mensaje de contacto</h2>
        <p style="margin:0 0 24px;color:#888;font-size:13px">Recibido el ${now}</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          ${row('Nombre', data.nombre)}
          ${row('Email', `<a href="mailto:${data.email}" style="color:#0066cc">${data.email}</a>`)}
          ${row('Teléfono', data.telefono)}
        </table>
        <div style="margin-top:20px;padding:16px;background:#f9f9f9;border-radius:8px;border-left:4px solid #ccc">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#888;letter-spacing:1px;text-transform:uppercase">Mensaje</p>
          <p style="margin:0;font-size:15px;color:#222;line-height:1.6;white-space:pre-wrap">${data.mensaje}</p>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="margin:0;font-size:12px;color:#aaa">Alcocars · Sistema automático</p>
      </div>
    </div>`;
}

function adminBookingHtml(data: BookingEmailData): string {
  const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  return `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        <h2 style="margin:0 0 4px;font-size:22px;color:#111">Nueva solicitud de reserva</h2>
        <p style="margin:0 0 24px;color:#888;font-size:13px">Recibida el ${now}</p>

        <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:14px;color:#795548">
            <strong>Código de solicitud:</strong>
            <span style="font-family:monospace;font-size:18px;color:#222;margin-left:8px">${data.confirmationCode}</span>
          </p>
        </div>

        <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#888;letter-spacing:1px;text-transform:uppercase">Cliente</h3>
        <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:20px">
          ${row('Nombre', `${data.client.firstName} ${data.client.lastName}`)}
          ${row('Email', `<a href="mailto:${data.client.email}" style="color:#0066cc">${data.client.email}</a>`)}
          ${row('Teléfono', data.client.phone)}
        </table>

        <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#888;letter-spacing:1px;text-transform:uppercase">Reserva</h3>
        <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:20px">
          ${row('Categoría', categoryLabel(data.category))}
          ${row('Sede', data.officeSlug.charAt(0).toUpperCase() + data.officeSlug.slice(1))}
          ${row('Fecha inicio', data.startDate)}
          ${row('Fecha fin', data.endDate)}
          ${row('Extras', extrasLabel(data.extras))}
          ${row('Total', `<strong style="font-size:17px">€${data.totalAmount.toFixed(2)}</strong>`)}
        </table>

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="margin:0;font-size:12px;color:#aaa">Alcocars · Sistema automático</p>
      </div>
    </div>`;
}

function customerReceiptHtml(data: BookingEmailData): string {
  const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  return `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        <h2 style="margin:0 0 8px;font-size:24px;color:#111">Solicitud recibida</h2>
        <p style="margin:0 0 24px;color:#555;font-size:15px">
          Hola <strong>${data.client.firstName}</strong>, hemos recibido tu solicitud de reserva.
        </p>

        <div style="background:#fff3cd;border:1px solid #ffc107;border-left:5px solid #ffc107;border-radius:8px;padding:16px 20px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#856404">⚠ Aviso importante</p>
          <p style="margin:0 0 8px;font-size:14px;color:#664d03;line-height:1.5">
            Esta solicitud <strong>no constituye una confirmación directa</strong> de la reserva.
          </p>
          <p style="margin:0;font-size:14px;color:#664d03;line-height:1.5">
            Nuestro equipo la procesará y recibirás respuesta en un máximo de <strong>24–48 horas</strong>.
          </p>
        </div>

        <div style="background:#f9f9f9;border-radius:8px;padding:20px 24px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#888;letter-spacing:1px;text-transform:uppercase">Código de solicitud</p>
          <p style="margin:0;font-family:monospace;font-size:26px;font-weight:700;color:#222;letter-spacing:2px">${data.confirmationCode}</p>
          <p style="margin:6px 0 0;font-size:12px;color:#aaa">Guarda este código para cualquier consulta</p>
        </div>

        <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#888;letter-spacing:1px;text-transform:uppercase">Resumen de tu solicitud</h3>
        <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:24px">
          ${row('Categoría', categoryLabel(data.category))}
          ${row('Sede', data.officeSlug.charAt(0).toUpperCase() + data.officeSlug.slice(1))}
          ${row('Fecha inicio', data.startDate)}
          ${row('Fecha fin', data.endDate)}
          ${row('Extras', extrasLabel(data.extras))}
          ${row('Total estimado', `<strong style="font-size:17px">€${data.totalAmount.toFixed(2)}</strong>`)}
        </table>

        <div style="background:#f0f7ff;border-radius:8px;padding:16px 20px;margin-bottom:24px">
          <p style="margin:0;font-size:14px;color:#1a3a6b;line-height:1.6">
            Si tienes alguna duda puedes contactarnos en
            <a href="mailto:info@alcocars.es" style="color:#0066cc">info@alcocars.es</a>
            o llamarnos al <strong>+34 976 XXX XXX</strong>.
          </p>
        </div>

        <p style="margin:0 0 4px;font-size:13px;color:#aaa">Enviado el ${now}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
        <p style="margin:0;font-size:12px;color:#aaa">Alcocars · Alquiler de vehículos · Zaragoza · Tudela · Soria</p>
      </div>
    </div>`;
}
