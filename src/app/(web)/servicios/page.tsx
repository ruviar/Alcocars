import type { Metadata } from 'next';
import ServicesPage from '../../../views/ServicesPage';

export const metadata: Metadata = {
  title: 'Servicios',
  description:
    'Renting flexible, alquiler por horas, recogida en el aeropuerto de Zaragoza, vehículos adaptados para silla de ruedas y venta multimarca, para empresas y particulares.',
};

export default function Page() {
  return <ServicesPage />;
}
