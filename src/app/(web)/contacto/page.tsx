import type { Metadata } from 'next';
import ContactPage from '../../../views/ContactPage';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contacta con Alcocars: teléfono 976 106 100, WhatsApp +34 608 808 240 o info@alcocars.es. De lunes a viernes de 9:00 a 13:00 y de 16:00 a 19:00; sábados de 9:00 a 12:30.',
};

export default function Page() {
  return <ContactPage />;
}
