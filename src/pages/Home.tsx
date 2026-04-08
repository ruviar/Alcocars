import FleetSection from '../components/Fleet/FleetSection';
import HeroSection from '../components/Hero/HeroSection';
import LocationsMap from '../components/Locations/LocationsMap';
import ServicesSection from '../components/Services/ServicesSection';
import CompanyShowcase from '../components/CompanyShowcase/CompanyShowcase';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FleetSection />
      <ServicesSection />
      <CompanyShowcase />
      <LocationsMap />
    </main>
  );
}
