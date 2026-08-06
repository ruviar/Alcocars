'use client';

import dynamic from 'next/dynamic';

/**
 * Leaflet accede a `window` al importarse, así que el mapa se carga solo en
 * cliente y de forma diferida (está al final de la portada).
 */
const LocationsMap = dynamic(() => import('./LocationsMap'), {
  ssr: false,
  loading: () => <div style={{ minHeight: 420 }} aria-hidden="true" />,
});

export default function LocationsMapLazy() {
  return <LocationsMap />;
}
