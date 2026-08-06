import type { Metadata } from 'next';
import FaqsPage from '../../../views/FaqsPage';

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description:
    'Resolvemos tus dudas sobre el alquiler: requisitos del conductor, fianza, franquicia del seguro, kilometraje incluido, combustible y política de devolución.',
};

export default function Page() {
  return <FaqsPage />;
}
