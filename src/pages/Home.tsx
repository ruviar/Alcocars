import FleetSection from '../components/Fleet/FleetSection';
import HeroSection from '../components/Hero/HeroSection';
import LocationsMap from '../components/Locations/LocationsMap';
import ServicesSection from '../components/Services/ServicesSection';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FleetSection />
      <ServicesSection />
      <LocationsMap />
    </main>
  );
}
