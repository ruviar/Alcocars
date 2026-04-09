import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer/Footer';
import CookieBanner from './components/Cookies/CookieBanner';
import SmartHeader from './components/Header/SmartHeader';
import ScrollToTop from './components/ScrollToTop';
import BlogPage from './pages/BlogPage';
import CompanyPage from './pages/CompanyPage';
import ContactPage from './pages/ContactPage';
import CheckoutPage from './pages/CheckoutPage';
import CategoriesPage from './pages/CategoriesPage';
import Home from './pages/Home';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import OfficesPage from './pages/OfficesPage';
import ServicesPage from './pages/ServicesPage';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <SmartHeader />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/empresa" element={<CompanyPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/flota" element={<CategoriesPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/sedes" element={<OfficesPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/reserva" element={<CheckoutPage />} />
        <Route path="/legal/:slug" element={<LegalPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Footer />
      <CookieBanner />
    </BrowserRouter>
  );
}

export default App;
