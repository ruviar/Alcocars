import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer/Footer';
import CookieBanner from './components/Cookies/CookieBanner';
import SmartHeader from './components/Header/SmartHeader';
import ScrollToTop from './components/ScrollToTop';
import RouteMeta from './components/Seo/RouteMeta';
import WhatsAppFab from './components/ui/WhatsAppFab';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import CompanyPage from './pages/CompanyPage';
import ContactPage from './pages/ContactPage';
import FaqsPage from './pages/FaqsPage';
import FleetPage from './pages/FleetPage';
import Home from './pages/Home';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import ServicesPage from './pages/ServicesPage';
import TarifasPage from './pages/TarifasPage';

// Carga diferida de las zonas pesadas: el checkout (calendario), las sedes
// (Leaflet) y todo el panel de administración, que la mayoría de visitantes
// nunca abre.
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OfficesPage = lazy(() => import('./pages/OfficesPage'));
const AdminLoginPage = lazy(() => import('./admin/AdminLoginPage'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminReservations = lazy(() => import('./admin/pages/AdminReservations'));
const AdminReservationDetail = lazy(() => import('./admin/pages/AdminReservationDetail'));
const AdminVehicles = lazy(() => import('./admin/pages/AdminVehicles'));
const AdminClients = lazy(() => import('./admin/pages/AdminClients'));
const AdminEmails = lazy(() => import('./admin/pages/AdminEmails'));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--silver)',
        fontSize: 14,
      }}
    >
      Cargando…
    </div>
  );
}

/**
 * Shell interno: decide si se pinta el chrome público (header, footer,
 * WhatsApp, cookies) según la ruta. El panel de administración va limpio.
 */
function AppShell() {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      <RouteMeta />

      {!isAdminArea && <SmartHeader />}

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Web pública */}
          <Route path="/" element={<Home />} />
          <Route path="/empresa" element={<CompanyPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/flota" element={<FleetPage />} />
          <Route path="/tarifas" element={<TarifasPage />} />
          <Route path="/faqs" element={<FaqsPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/sedes" element={<OfficesPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/reserva" element={<CheckoutPage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />

          {/* Panel de administración */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="reservas" element={<AdminReservations />} />
            <Route path="reservas/:id" element={<AdminReservationDetail />} />
            <Route path="vehiculos" element={<AdminVehicles />} />
            <Route path="clientes" element={<AdminClients />} />
            <Route path="correo" element={<AdminEmails />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {!isAdminArea && <Footer />}
      {!isAdminArea && <WhatsAppFab />}
      {!isAdminArea && <CookieBanner />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
