import { useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer/Footer';
import CookieBanner from './components/Cookies/CookieBanner';
import SmartHeader from './components/Header/SmartHeader';
import ScrollToTop from './components/ScrollToTop';
import BlogPage from './pages/BlogPage';
import CompanyPage from './pages/CompanyPage';
import ContactPage from './pages/ContactPage';
import CheckoutPage from './pages/CheckoutPage';
import FleetPage from './pages/FleetPage';
import Home from './pages/Home';
import LegalPage from './pages/LegalPage';
import NotFoundPage from './pages/NotFoundPage';
import OfficesPage from './pages/OfficesPage';
import ServicesPage from './pages/ServicesPage';

function App() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = ringRef.current;

    if (!cursor || !ring) {
      return;
    }

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let rafId = 0;

    const animate = () => {
      cursor.style.left = `${pointerX}px`;
      cursor.style.top = `${pointerY}px`;

      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;

      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;

      rafId = window.requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const isInteractive = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return Boolean(
        target.closest('a, button, input, select, textarea, [role="button"]'),
      );
    };

    const handleMouseOver = (event: MouseEvent) => {
      if (!isInteractive(event.target)) {
        return;
      }

      cursor.classList.add('hovering');
      ring.classList.add('hovering');
    };

    const handleMouseOut = (event: MouseEvent) => {
      if (!isInteractive(event.target)) {
        return;
      }

      cursor.classList.remove('hovering');
      ring.classList.remove('hovering');
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />

      <div ref={cursorRef} className="cursor" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />

      <SmartHeader />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/empresa" element={<CompanyPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/flota" element={<FleetPage />} />
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
