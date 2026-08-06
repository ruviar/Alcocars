/**
 * Envío de correo transaccional.
 *
 * Proveedor: API HTTP de Brevo (puerto 443). Se eligió API sobre SMTP porque
 * Railway y buena parte de los PaaS bloquean los puertos SMTP salientes.
 *
 * Tres garantías que antes no había:
 *   1. El envío se espera (`await`), no se lanza al vacío. Quien llama sabe si
 *      salió o no.
 *   2. Todo intento queda registrado en la tabla `email_logs`, con el id del
 *      proveedor o el error. Un fallo del proveedor deja de ser invisible.
 *   3. Sin credenciales configuradas no se rompe nada: se escribe una vista
 *      previa HTML en `server/.mail-preview/` y se registra como SKIPPED, para
 *      poder revisar el diseño del email en local.
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { EmailKind, EmailStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import { COMPANY, OFFICES, mapsLink } from '../config/company';
import { RENTAL_RULES, type Quote } from '../config/catalog';

const BREVO_SEND_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';
const PREVIEW_DIR = join(process.cwd(), '.mail-preview');

/** En serverless el sistema de archivos es de solo lectura salvo /tmp. */
const CAN_WRITE_PREVIEW = !process.env.VERCEL && env.NODE_ENV !== 'production';

// ── Paleta del email (alineada con la web) ───────────────────────────────────
const INK = '#012369';
const INK_SOFT = '#4A5A7A';
const ACCENT = '#AFE23A';
const PAGE_BG = '#EEF1F7';
const BORDER = '#E1E6F0';

type Mailbox = { email: string; name?: string };

export interface SendEmailResult {
  status: EmailStatus;
  providerId?: string;
  error?: string;
  previewPath?: string;
}

interface SendEmailInput {
  kind: EmailKind;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  reservationId?: string;
}

function isEmailApiConfigured(): boolean {
  return Boolean(env.BREVO_API_KEY && env.SMTP_FROM);
}

function parseMailbox(raw: string): Mailbox | null {
  const value = raw.trim();
  if (!value) return null;

  const namedAddress = value.match(/^(?<name>[^<>]+?)\s*<(?<email>[^<>@\s]+@[^<>\s]+)>$/);
  if (namedAddress?.groups?.email) {
    const email = namedAddress.groups.email.trim();
    const name = namedAddress.groups.name?.trim();
    return name ? { email, name } : { email };
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { email: value };

  return null;
}

async function logEmail(input: {
  kind: EmailKind;
  status: EmailStatus;
  to: string;
  subject: string;
  providerId?: string;
  error?: string;
  reservationId?: string;
}): Promise<void> {
  // El registro nunca debe tumbar el envío ni la petición HTTP.
  try {
    await prisma.emailLog.create({
      data: {
        kind: input.kind,
        status: input.status,
        to: input.to,
        subject: input.subject,
        providerId: input.providerId ?? null,
        error: input.error?.slice(0, 1000) ?? null,
        reservationId: input.reservationId ?? null,
      },
    });
  } catch (err) {
    console.error('[MAILER] no se pudo registrar el email en email_logs:', err);
  }
}

function writePreview(kind: EmailKind, html: string): string | undefined {
  if (!CAN_WRITE_PREVIEW) return undefined;

  try {
    mkdirSync(PREVIEW_DIR, { recursive: true });
    const stampName = new Date().toISOString().replace(/[:.]/g, '-');
    const path = join(PREVIEW_DIR, `${stampName}-${kind}.html`);
    writeFileSync(path, html, 'utf8');
    return path;
  } catch (err) {
    console.error('[MAILER] no se pudo escribir la vista previa:', err);
    return undefined;
  }
}

/**
 * Envía un email y devuelve el resultado. No lanza: el fallo se devuelve para
 * que quien llama decida (una solicitud de reserva se guarda igual aunque el
 * correo falle).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { kind, to, subject, html, text, replyTo, reservationId } = input;

  if (!isEmailApiConfigured()) {
    const previewPath = writePreview(kind, html);
    const note = `EMAIL_NOT_CONFIGURED (falta BREVO_API_KEY o SMTP_FROM)${
      previewPath ? ` · vista previa: ${previewPath}` : ''
    }`;
    console.warn(`[MAILER] ${note}`);
    await logEmail({ kind, status: 'SKIPPED', to, subject, error: note, reservationId });
    return { status: 'SKIPPED', error: note, previewPath };
  }

  const sender = parseMailbox(env.SMTP_FROM as string);
  const recipient = parseMailbox(to);
  const parsedReplyTo = replyTo ? parseMailbox(replyTo) : null;

  if (!sender) {
    const error = 'SMTP_FROM no es un remitente válido (usa: Alcocars <reservas@tudominio.es>)';
    await logEmail({ kind, status: 'FAILED', to, subject, error, reservationId });
    return { status: 'FAILED', error };
  }

  if (!recipient) {
    const error = `Destinatario inválido: ${to}`;
    await logEmail({ kind, status: 'FAILED', to, subject, error, reservationId });
    return { status: 'FAILED', error };
  }

  try {
    const response = await fetch(BREVO_SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': env.BREVO_API_KEY as string,
      },
      body: JSON.stringify({
        sender,
        to: [recipient],
        replyTo: parsedReplyTo ?? undefined,
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const body = await response.text();
      const error = `Brevo API ${response.status}: ${body.slice(0, 400)}`;
      console.error(`[MAILER] ${error}`);
      await logEmail({ kind, status: 'FAILED', to, subject, error, reservationId });
      return { status: 'FAILED', error };
    }

    const payload = (await response.json().catch(() => ({}))) as { messageId?: string };
    await logEmail({
      kind,
      status: 'SENT',
      to,
      subject,
      providerId: payload.messageId,
      reservationId,
    });
    return { status: 'SENT', providerId: payload.messageId };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[MAILER] fallo enviando el email:', error);
    await logEmail({ kind, status: 'FAILED', to, subject, error, reservationId });
    return { status: 'FAILED', error };
  }
}

// ── Formato ──────────────────────────────────────────────────────────────────

const MADRID = 'Europe/Madrid';

function euro(value: number): string {
  return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

function dateLong(value: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: MADRID,
  }).format(value);
}

function dateShort(value: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: MADRID,
  }).format(value);
}

function timeOnly(value: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MADRID,
  }).format(value);
}

function stamp(): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: MADRID,
  }).format(new Date());
}

/** Escapa texto de usuario antes de meterlo en el HTML del email. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Bloques de plantilla ─────────────────────────────────────────────────────

function shell(options: { preheader: string; badge: string; title: string; body: string }): string {
  const { preheader, badge, title, body } = options;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
<div style="display:none;font-size:1px;color:${PAGE_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 14px rgba(1,35,105,.10);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

        <tr>
          <td style="background:${INK};padding:26px 32px 22px;">
            <p style="margin:0;font-size:19px;font-weight:700;letter-spacing:4px;color:#FFFFFF;">ALCOCARS</p>
            <p style="margin:4px 0 0;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${ACCENT};">${esc(badge)}</p>
          </td>
        </tr>
        <tr><td style="height:4px;background:${ACCENT};font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr>
          <td style="padding:32px;">
${body}
          </td>
        </tr>

        <tr>
          <td style="background:#F7F9FC;border-top:1px solid ${BORDER};padding:24px 32px;">
            <p style="margin:0 0 12px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${INK_SOFT};font-weight:700;">Nuestras oficinas</p>
            ${OFFICES.map(
              (office) => `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${INK_SOFT};">
              <strong style="color:${INK};">${esc(office.city)}</strong> · <a href="tel:+34${office.phone.replace(/\s+/g, '')}" style="color:${INK};text-decoration:none;">${esc(office.phone)}</a><br>
              <a href="${mapsLink(office)}" style="color:${INK_SOFT};text-decoration:underline;">${esc(office.address)}</a>
            </p>`,
            ).join('')}
            <p style="margin:16px 0 0;font-size:11px;color:#9AA5BC;line-height:1.6;">
              ${esc(COMPANY.name)} · Alquiler y renting de vehículos en ${esc(COMPANY.regions.join(' · '))}<br>
              Email enviado automáticamente el ${esc(stamp())}.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;color:${INK};font-weight:700;">${esc(text)}</h1>`;
}

function lead(html: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${INK_SOFT};">${html}</p>`;
}

function sectionTitle(text: string): string {
  return `<p style="margin:28px 0 10px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${INK_SOFT};font-weight:700;">${esc(text)}</p>`;
}

function codeChip(code: string, caption: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
      <td style="background:#F4F8E6;border:1px solid ${ACCENT};border-radius:12px;padding:18px 22px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#5C7A16;font-weight:700;">Código de solicitud</p>
        <p style="margin:0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:26px;font-weight:700;letter-spacing:2px;color:${INK};">${esc(code)}</p>
        <p style="margin:6px 0 0;font-size:12px;color:${INK_SOFT};">${esc(caption)}</p>
      </td>
    </tr>
  </table>`;
}

function dataTable(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;border-collapse:separate;overflow:hidden;">
    ${rows
      .map(
        ([label, value], index) => `<tr>
        <td valign="top" style="padding:11px 16px;font-size:13px;color:${INK_SOFT};white-space:nowrap;background:#FBFCFE;${index > 0 ? `border-top:1px solid ${BORDER};` : ''}">${esc(label)}</td>
        <td style="padding:11px 16px;font-size:14px;color:${INK};font-weight:600;${index > 0 ? `border-top:1px solid ${BORDER};` : ''}">${value}</td>
      </tr>`,
      )
      .join('')}
  </table>`;
}

function totalsTable(quote: Quote): string {
  const rows: string[] = [];

  const push = (label: string, value: string) => {
    rows.push(`<tr>
      <td style="padding:10px 16px;font-size:14px;color:${INK};border-top:1px solid ${BORDER};line-height:1.5;">${label}</td>
      <td align="right" valign="top" style="padding:10px 16px;font-size:14px;color:${INK};font-weight:600;border-top:1px solid ${BORDER};white-space:nowrap;">${value}</td>
    </tr>`);
  };

  push(
    `Tarifa base · ${quote.totalDays} día${quote.totalDays === 1 ? '' : 's'}<br><span style="font-size:12px;color:${INK_SOFT};">${esc(quote.tariffName)}</span>`,
    quote.baseTotal === null ? 'A consultar' : euro(quote.baseTotal),
  );

  push(
    `Kilometraje<br><span style="font-size:12px;color:${INK_SOFT};">${quote.plannedKm.toLocaleString('es-ES')} km previstos · ${quote.includedKm.toLocaleString('es-ES')} km incluidos</span>`,
    quote.extraKm > 0
      ? `${euro(quote.extraKmSurcharge)}<br><span style="font-size:12px;font-weight:400;color:${INK_SOFT};">${quote.extraKm} km × ${quote.extraKmRate.toFixed(2).replace('.', ',')} €</span>`
      : 'Incluido',
  );

  for (const extra of quote.extras) {
    push(
      `${esc(extra.label)}${extra.quantity > 1 ? `<br><span style="font-size:12px;color:${INK_SOFT};">× ${extra.quantity}</span>` : ''}`,
      euro(extra.totalPrice),
    );
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;border-collapse:separate;overflow:hidden;">
    ${rows.join('')}
    <tr>
      <td style="padding:16px;font-size:15px;font-weight:700;color:${INK};background:#F4F8E6;border-top:2px solid ${ACCENT};">Total estimado</td>
      <td align="right" style="padding:16px;font-size:20px;font-weight:700;color:${INK};background:#F4F8E6;border-top:2px solid ${ACCENT};white-space:nowrap;">${
        quote.totalAmount === null ? 'A consultar' : euro(quote.totalAmount)
      }</td>
    </tr>
  </table>`;
}

function button(href: string, label: string, variant: 'solid' | 'ghost' = 'solid'): string {
  const solid = `background:${INK};color:#FFFFFF;border:1px solid ${INK};`;
  const ghost = `background:#FFFFFF;color:${INK};border:1px solid ${BORDER};`;
  return `<a href="${href}" style="display:inline-block;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;${variant === 'solid' ? solid : ghost}">${esc(label)}</a>`;
}

function notice(options: { tone: 'warn' | 'info'; title: string; body: string }): string {
  const palette =
    options.tone === 'warn'
      ? { bg: '#FFF8E6', border: '#F0C24B', text: '#6B4E06' }
      : { bg: '#EEF4FF', border: '#BFD3F5', text: '#1A3A6B' };

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
    <tr>
      <td style="background:${palette.bg};border:1px solid ${palette.border};border-left:4px solid ${palette.border};border-radius:10px;padding:16px 18px;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${palette.text};">${esc(options.title)}</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:${palette.text};">${options.body}</p>
      </td>
    </tr>
  </table>`;
}

// ── Email de reserva ─────────────────────────────────────────────────────────

export interface BookingEmailPayload {
  confirmationCode: string;
  reservationId: string;
  client: { firstName: string; lastName: string; email: string; phone: string };
  quote: Quote;
  pickupOffice: { city: string; address: string };
  returnOffice: { city: string; address: string };
  pickupAt: Date;
  returnAt: Date;
  notes?: string;
  needsAvailabilityCheck: boolean;
}

function bookingRows(data: BookingEmailPayload): Array<[string, string]> {
  const sameOffice = data.pickupOffice.city === data.returnOffice.city;

  return [
    [
      'Recogida',
      `${esc(dateLong(data.pickupAt))}, ${esc(timeOnly(data.pickupAt))}<br><span style="font-weight:400;color:${INK_SOFT};font-size:13px;">${esc(data.pickupOffice.city)} · ${esc(data.pickupOffice.address)}</span>`,
    ],
    [
      'Devolución',
      `${esc(dateLong(data.returnAt))}, ${esc(timeOnly(data.returnAt))}<br><span style="font-weight:400;color:${INK_SOFT};font-size:13px;">${
        sameOffice ? 'Misma oficina' : `${esc(data.returnOffice.city)} · ${esc(data.returnOffice.address)}`
      }</span>`,
    ],
    ['Duración', `${data.quote.totalDays} día${data.quote.totalDays === 1 ? '' : 's'}`],
    [
      'Gama',
      `${esc(data.quote.tariffName)} <span style="font-weight:400;color:${INK_SOFT};font-size:13px;">(${esc(data.quote.superCategory)})</span>`,
    ],
    [
      'Kilometraje',
      `${data.quote.plannedKm.toLocaleString('es-ES')} km previstos<br><span style="font-weight:400;color:${INK_SOFT};font-size:13px;">${data.quote.includedKm.toLocaleString('es-ES')} km incluidos en la tarifa</span>`,
    ],
    ['Fianza / franquicia', `${euro(data.quote.deposit)} / ${euro(data.quote.franchise)}`],
  ];
}

function bookingText(data: BookingEmailPayload, audience: 'admin' | 'customer'): string {
  const lines = [
    audience === 'admin'
      ? `NUEVA SOLICITUD DE RESERVA · ${data.confirmationCode}`
      : `SOLICITUD RECIBIDA · ${data.confirmationCode}`,
    '',
    `Cliente: ${data.client.firstName} ${data.client.lastName}`,
    `Email: ${data.client.email}`,
    `Teléfono: ${data.client.phone}`,
    '',
    `Recogida: ${dateLong(data.pickupAt)} a las ${timeOnly(data.pickupAt)} — ${data.pickupOffice.city}`,
    `Devolución: ${dateLong(data.returnAt)} a las ${timeOnly(data.returnAt)} — ${data.returnOffice.city}`,
    `Duración: ${data.quote.totalDays} día(s)`,
    `Gama: ${data.quote.tariffName} (${data.quote.superCategory})`,
    `Kilometraje: ${data.quote.plannedKm} km previstos, ${data.quote.includedKm} incluidos, ${data.quote.extraKm} extra`,
    '',
    'DESGLOSE',
    `Tarifa base: ${data.quote.baseTotal === null ? 'A consultar' : euro(data.quote.baseTotal)}`,
    `Km extra: ${euro(data.quote.extraKmSurcharge)}`,
    ...(data.quote.extras.length > 0
      ? data.quote.extras.map((extra) => `${extra.label} x${extra.quantity}: ${euro(extra.totalPrice)}`)
      : ['Extras: ninguno']),
    `TOTAL ESTIMADO: ${data.quote.totalAmount === null ? 'A consultar' : euro(data.quote.totalAmount)}`,
    `Fianza: ${euro(data.quote.deposit)} · Franquicia: ${euro(data.quote.franchise)}`,
    '',
    `Observaciones: ${data.notes?.trim() || 'sin observaciones'}`,
  ];

  if (audience === 'admin' && data.needsAvailabilityCheck) {
    lines.push(
      '',
      'AVISO: no había unidad libre de esa gama en el momento de la solicitud. Comprobar disponibilidad.',
    );
  }

  if (audience === 'customer') {
    lines.push(
      '',
      'Esta solicitud NO es una reserva confirmada. Nuestro equipo la revisa y te',
      'contacta en un máximo de 24-48 horas laborables.',
      '',
      `Requisitos: ${RENTAL_RULES.minDriverAge} años cumplidos y carnet con ${RENTAL_RULES.minLicenceYears} años de antigüedad.`,
      `Cualquier duda: ${COMPANY.phone} · ${COMPANY.email}`,
    );
  }

  return lines.join('\n');
}

export function buildBookingAdminEmail(data: BookingEmailPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const range = `${dateShort(data.pickupAt)}–${dateShort(data.returnAt)}`;
  const subject = `Nueva reserva ${data.confirmationCode} · ${data.quote.tariffName} · ${data.pickupOffice.city} · ${range}`;

  const body = `
    ${h1('Nueva solicitud de reserva')}
    ${lead(
      `Entrada por el formulario web el <strong>${esc(stamp())}</strong>. Contesta a este correo para responder directamente al cliente.`,
    )}
    ${codeChip(data.confirmationCode, 'Referencia interna de la solicitud')}

    ${sectionTitle('Cliente')}
    ${dataTable([
      ['Nombre', esc(`${data.client.firstName} ${data.client.lastName}`)],
      ['Email', `<a href="mailto:${esc(data.client.email)}" style="color:${INK};">${esc(data.client.email)}</a>`],
      [
        'Teléfono',
        `<a href="tel:${esc(data.client.phone.replace(/\s+/g, ''))}" style="color:${INK};">${esc(data.client.phone)}</a>`,
      ],
    ])}

    ${sectionTitle('Reserva solicitada')}
    ${dataTable(bookingRows(data))}

    ${sectionTitle('Desglose económico')}
    ${totalsTable(data.quote)}

    ${sectionTitle('Observaciones del cliente')}
    <p style="margin:0;padding:14px 16px;background:#FBFCFE;border:1px solid ${BORDER};border-radius:10px;font-size:14px;line-height:1.6;color:${INK};white-space:pre-wrap;">${
      data.notes?.trim() ? esc(data.notes.trim()) : `<span style="color:${INK_SOFT};">Sin observaciones.</span>`
    }</p>

    ${
      data.needsAvailabilityCheck
        ? notice({
            tone: 'warn',
            title: 'Revisar disponibilidad',
            body: 'En el momento de la solicitud no había ninguna unidad libre de esta gama en la sede de recogida. La solicitud se ha guardado igualmente para no perder al cliente.',
          })
        : ''
    }

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding-right:10px;">${button(
          `mailto:${data.client.email}?subject=${encodeURIComponent(
            `Tu reserva en Alcocars (${data.confirmationCode})`,
          )}`,
          'Responder al cliente',
        )}</td>
        <td>${button(`tel:${data.client.phone.replace(/\s+/g, '')}`, 'Llamar', 'ghost')}</td>
      </tr>
    </table>
  `;

  return {
    subject,
    html: shell({
      preheader: `${data.client.firstName} ${data.client.lastName} · ${data.quote.tariffName} · ${range} · ${
        data.quote.totalAmount === null ? 'a consultar' : euro(data.quote.totalAmount)
      }`,
      badge: 'Solicitud de reserva',
      title: subject,
      body,
    }),
    text: bookingText(data, 'admin'),
  };
}

export function buildBookingCustomerEmail(data: BookingEmailPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Hemos recibido tu solicitud · Alcocars · ${data.confirmationCode}`;

  const body = `
    ${h1(`Gracias, ${data.client.firstName}`)}
    ${lead(
      'Hemos recibido tu solicitud de reserva y ya está en manos de nuestro equipo. Aquí tienes el resumen de lo que nos has pedido.',
    )}
    ${codeChip(data.confirmationCode, 'Guarda este código para cualquier consulta')}

    ${notice({
      tone: 'warn',
      title: 'Esto todavía no es una reserva confirmada',
      body: 'Comprobamos la disponibilidad real de la unidad y te contactamos en un máximo de <strong>24–48 horas laborables</strong> para cerrar los detalles. Si necesitas el vehículo antes, llámanos y lo resolvemos por teléfono.',
    })}

    ${sectionTitle('Tu solicitud')}
    ${dataTable(bookingRows(data))}

    ${sectionTitle('Desglose estimado')}
    ${totalsTable(data.quote)}

    <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${INK_SOFT};">
      Importes con IVA incluido. El total es una estimación calculada con los datos que nos has facilitado y
      puede variar si cambian las fechas, el kilometraje real o los extras. La tarifa incluye
      ${RENTAL_RULES.includedKmPerDay} km por día, seguro a todo riesgo con franquicia de ${euro(data.quote.franchise)}
      y responsabilidad civil obligatoria y complementaria.
    </p>

    ${notice({
      tone: 'info',
      title: 'Qué necesitas el día de la recogida',
      body: `DNI o pasaporte en vigor y permiso de conducir válido en España con al menos ${RENTAL_RULES.minLicenceYears} años de antigüedad (edad mínima ${RENTAL_RULES.minDriverAge} años), más una tarjeta de crédito para la fianza de ${euro(data.quote.deposit)}. El vehículo se entrega con el depósito lleno y debe devolverse igual.`,
    })}

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding-right:10px;">${button(
          `https://wa.me/${COMPANY.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            `Hola, os escribo por mi solicitud de reserva ${data.confirmationCode}.`,
          )}`,
          'Escribirnos por WhatsApp',
        )}</td>
        <td>${button(`tel:+34${COMPANY.phone.replace(/\s+/g, '')}`, `Llamar al ${COMPANY.phone}`, 'ghost')}</td>
      </tr>
    </table>
  `;

  return {
    subject,
    html: shell({
      preheader: `Solicitud ${data.confirmationCode} · ${data.quote.tariffName} · ${dateShort(data.pickupAt)}–${dateShort(
        data.returnAt,
      )}`,
      badge: 'Resumen de tu solicitud',
      title: subject,
      body,
    }),
    text: bookingText(data, 'customer'),
  };
}

/**
 * Envía el aviso interno y el resguardo al cliente. Devuelve el resultado de
 * cada envío para que el endpoint pueda avisar si algo falló.
 */
export async function sendBookingEmails(data: BookingEmailPayload): Promise<{
  admin: SendEmailResult;
  customer: SendEmailResult;
}> {
  const adminEmail = buildBookingAdminEmail(data);
  const customerEmail = buildBookingCustomerEmail(data);

  const [admin, customer] = await Promise.all([
    sendEmail({
      kind: 'BOOKING_ADMIN',
      to: env.NOTIFY_EMAIL,
      replyTo: data.client.email,
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
      reservationId: data.reservationId,
    }),
    sendEmail({
      kind: 'BOOKING_CUSTOMER',
      to: data.client.email,
      subject: customerEmail.subject,
      html: customerEmail.html,
      text: customerEmail.text,
      reservationId: data.reservationId,
    }),
  ]);

  return { admin, customer };
}

// ── Email de contacto ────────────────────────────────────────────────────────

export interface ContactEmailData {
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
}

export function buildContactEmail(data: ContactEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Nuevo mensaje web de ${data.nombre}`;

  const body = `
    ${h1('Nuevo mensaje de contacto')}
    ${lead(`Recibido el <strong>${esc(stamp())}</strong>. Responde a este correo para contestar al remitente.`)}

    ${dataTable([
      ['Nombre', esc(data.nombre)],
      ['Email', `<a href="mailto:${esc(data.email)}" style="color:${INK};">${esc(data.email)}</a>`],
      [
        'Teléfono',
        `<a href="tel:${esc(data.telefono.replace(/\s+/g, ''))}" style="color:${INK};">${esc(data.telefono)}</a>`,
      ],
    ])}

    ${sectionTitle('Mensaje')}
    <p style="margin:0;padding:16px 18px;background:#FBFCFE;border:1px solid ${BORDER};border-radius:10px;font-size:15px;line-height:1.65;color:${INK};white-space:pre-wrap;">${esc(
      data.mensaje,
    )}</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding-right:10px;">${button(`mailto:${data.email}`, 'Responder')}</td>
        <td>${button(`tel:${data.telefono.replace(/\s+/g, '')}`, 'Llamar', 'ghost')}</td>
      </tr>
    </table>
  `;

  return {
    subject,
    html: shell({
      preheader: `${data.nombre} · ${data.telefono} · ${data.mensaje.slice(0, 90)}`,
      badge: 'Formulario de contacto',
      title: subject,
      body,
    }),
    text: [
      'NUEVO MENSAJE DE CONTACTO',
      '',
      `Nombre: ${data.nombre}`,
      `Email: ${data.email}`,
      `Teléfono: ${data.telefono}`,
      '',
      data.mensaje,
    ].join('\n'),
  };
}

export async function sendContactNotification(data: ContactEmailData): Promise<SendEmailResult> {
  const email = buildContactEmail(data);

  return sendEmail({
    kind: 'CONTACT_ADMIN',
    to: env.NOTIFY_EMAIL,
    replyTo: data.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}
