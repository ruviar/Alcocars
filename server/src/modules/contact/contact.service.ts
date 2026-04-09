import { sendContactNotification } from '../../utils/mailer';
import type { ContactBody } from './contact.schema';

export async function processContactForm(data: ContactBody): Promise<void> {
  console.log('[CONTACT FORM]', {
    from: data.email,
    name: data.nombre,
    phone: data.telefono,
    receivedAt: new Date().toISOString(),
  });

  sendContactNotification({
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono,
    mensaje: data.mensaje,
  });
}
