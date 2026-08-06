import CompanyShowcase from '../components/CompanyShowcase/CompanyShowcase';
import FleetSection from '../components/Fleet/FleetSection';
import HeroSection from '../components/Hero/HeroSection';
import LocationsMapLazy from '../components/Locations/LocationsMapLazy';
import ServicesSection from '../components/Services/ServicesSection';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FleetSection />
      <ServicesSection />
      <CompanyShowcase />
      <LocationsMapLazy />
    </main>
  );
}
