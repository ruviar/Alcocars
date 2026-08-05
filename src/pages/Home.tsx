import { Suspense, lazy } from 'react';
import FleetSection from '../components/Fleet/FleetSection';
import HeroSection from '../components/Hero/HeroSection';
import ServicesSection from '../components/Services/ServicesSection';
import CompanyShowcase from '../components/CompanyShowcase/CompanyShowcase';

// Leaflet pesa ~150 kB: el mapa de sedes se carga aparte para no penalizar
// el primer pintado de la portada (está al final de la página).
const LocationsMap = lazy(() => import('../components/Locations/LocationsMap'));

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FleetSection />
      <ServicesSection />
      <CompanyShowcase />
      <Suspense fallback={<div style={{ minHeight: 420 }} aria-hidden="true" />}>
        <LocationsMap />
      </Suspense>
    </main>
  );
}
