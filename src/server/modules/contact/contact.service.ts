import { sendContactNotification, type SendEmailResult } from '../../utils/mailer';
import type { ContactBody } from './contact.schema';

/**
 * Procesa el formulario de contacto. Devuelve el resultado del envío para que
 * el endpoint pueda avisar al usuario si el aviso no llegó, en lugar de
 * mostrarle un «mensaje enviado» que no es cierto.
 */
export async function processContactForm(data: ContactBody): Promise<SendEmailResult> {
  const result = await sendContactNotification(data);

  if (result.status !== 'SENT') {
    console.error('[CONTACT] el aviso por email no se entregó:', result.error);
  }

  return result;
}
