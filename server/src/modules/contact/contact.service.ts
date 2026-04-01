import type { ContactBody } from './contact.schema';

export async function processContactForm(data: ContactBody): Promise<void> {
  // MVP: log to console. Replace with Nodemailer when SMTP is configured.
  console.log('[CONTACT FORM]', {
    from: data.email,
    name: data.nombre,
    phone: data.telefono,
    message: data.mensaje,
    receivedAt: new Date().toISOString(),
  });
}
