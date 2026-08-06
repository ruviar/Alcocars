import type { Metadata } from 'next';
import FleetPage from '../../../views/FleetPage';

export const metadata: Metadata = {
  title: 'Flota de vehículos',
  description:
    'Flota multimarca de Alcocars: coches, furgonetas de carga y de pasajeros, todoterrenos, pick-ups y autocaravanas. Vehículos revisados y listos para entregar.',
};

export default function Page() {
  return <FleetPage />;
}
