import type { Metadata } from 'next';
import CookieBanner from '../components/Cookies/CookieBanner';
import Footer from '../components/Footer/Footer';
import SmartHeader from '../components/Header/SmartHeader';
import NotFoundPage from '../views/NotFoundPage';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description:
    'La página que buscas no existe o ha cambiado de dirección. Vuelve al inicio para consultar la flota, las tarifas y las oficinas de Alcocars.',
};

// not-found vive fuera del grupo (web): monta su propio chrome público.
export default function NotFound() {
  return (
    <>
      <SmartHeader />
      <NotFoundPage />
      <Footer />
      <CookieBanner />
    </>
  );
}
