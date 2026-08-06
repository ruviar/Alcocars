import type { Metadata } from 'next';
import TarifasPage from '../../../views/TarifasPage';

export const metadata: Metadata = {
  title: 'Tarifas de alquiler',
  description:
    'Tarifas de alquiler con IVA incluido: coches desde 61 €/día con 200 km diarios, seguro a todo riesgo y asistencia 24 h. Consulta el precio por gama y por días.',
};

export default function Page() {
  return <TarifasPage />;
}
