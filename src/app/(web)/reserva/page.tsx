import { Suspense } from 'react';
import type { Metadata } from 'next';
import CheckoutPage from '../../../views/CheckoutPage';

export const metadata: Metadata = {
  title: 'Solicitud de reserva',
  description:
    'Solicita tu reserva sin pago por adelantado: elige vehículo, fechas y oficina de recogida. Nuestro equipo te responde en un plazo de 24 a 48 horas laborables.',
  robots: { index: false, follow: false },
};

// useSearchParams exige un límite de Suspense en páginas prerenderizadas.
export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} aria-hidden="true" />}>
      <CheckoutPage />
    </Suspense>
  );
}
