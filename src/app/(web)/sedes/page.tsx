import type { Metadata } from 'next';
import OfficesPage from '../../../views/OfficesPageLazy';

export const metadata: Metadata = {
  title: 'Sedes y oficinas',
  description:
    'Oficinas de Alcocars en Zaragoza (Ctra. de Logroño, km 6,4), Tudela (Av. de Zaragoza, 46) y Ágreda (Ctra. N-122, km 105). Horarios, teléfonos y cómo llegar.',
};

export default function Page() {
  return <OfficesPage />;
}
