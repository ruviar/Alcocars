import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import styles from './SmartHeader.module.css';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Flota', href: '/flota' },
  { label: 'Tarifas', href: '/tarifas' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Sedes', href: '/sedes' },
  { label: 'Empresa', href: '/empresa' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Contacto', href: '/contacto' },
];

export default function SmartHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (currentY < 80) {
        gsap.to(header, { y: 0, duration: 0.4, ease: 'power2.out' });
      } else if (diff > 4) {
        gsap.to(header, { y: '-100%', duration: 0.4, ease: 'power2.in' });
      } else if (diff < -4) {
        gsap.to(header, { y: 0, duration: 0.5, ease: 'power2.out' });
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const header = headerRef.current;

      if (!header) {
        return;
      }

      const target = event.target;

      if (target instanceof Node && !header.contains(target)) {
        setMobileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    const handleWindowBlur = () => {
      setMobileOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  useEffect(() => {
    // Cerrar el menú móvil al navegar es una sincronización con la URL:
    // el "cascading render" que señala la regla es exactamente lo que queremos.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  /** Repetir clic en un enlace de la página actual sube al principio. */
  const handleSamePageClick = (href: string) => {
    if (location.pathname === href) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isCurrentPath = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link
          to="/"
          className={styles.logo}
          onClick={() => handleSamePageClick('/')}
          aria-label="Ir al inicio de Alcocars"
        >
          <img src="/images/logo.png" alt="Alcocars" className={styles.logoImage} loading="eager" />
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav} aria-label="Navegación principal">
          {navLinks.map(link => (
            <div key={link.label} className={styles.navItem}>
              <Link
                to={link.href}
                className={`${styles.navLink} ${isCurrentPath(link.href) ? styles.navLinkActive : ''}`}
                aria-current={isCurrentPath(link.href) ? 'page' : undefined}
                onClick={() => handleSamePageClick(link.href)}
              >
                {link.label}
              </Link>
            </div>
          ))}
        </nav>

        {/* CTA */}
        <Link to="/reserva" className={styles.cta}>
          <span>Reservar</span>
        </Link>

        {/* Mobile hamburger */}
        <button
          className={`${styles.burger} ${mobileOpen ? styles.burgerOpen : ''}`}
          onClick={() => setMobileOpen(p => !p)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(link => (
            <Link
              key={link.label}
              to={link.href}
              className={styles.mobileLink}
              onClick={() => handleSamePageClick(link.href)}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/reserva" className={styles.mobileCta}>
            Reservar ahora →
          </Link>
        </div>
      )}
    </header>
  );
}
