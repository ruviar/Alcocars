import { Suspense } from 'react';
import AdminReservations from '../../../../admin/views/AdminReservations';

export const metadata = { title: 'Reservas' };

// useSearchParams exige un límite de Suspense en páginas prerenderizadas.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminReservations />
    </Suspense>
  );
}
