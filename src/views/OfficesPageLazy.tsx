'use client';

import dynamic from 'next/dynamic';

/** Leaflet accede a `window` al importarse: la página de sedes va sin SSR. */
const OfficesPage = dynamic(() => import('./OfficesPage'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '70vh' }} aria-hidden="true" />,
});

export default function OfficesPageLazy() {
  return <OfficesPage />;
}
