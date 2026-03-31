import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import styles from './SmartHeader.module.css';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Flota', href: '/flota' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Blog', href: '/blog' },
  { label: 'Sedes', href: '/sedes' },
  { label: 'Empresa', href: '/empresa' },
  { label: 'Contacto', href: '/contacto' },
];

export default function SmartHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const pendingScrollTimeoutRef = useRef<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);
  const navigate = useNavigate();
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
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (pendingScrollTimeoutRef.current !== null) {
        window.clearTimeout(pendingScrollTimeoutRef.current);
      }
    };
  }, []);

  const performScroll = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollTo = (href: string) => {
    setMobileOpen(false);

    if (pendingScrollTimeoutRef.current !== null) {
      window.clearTimeout(pendingScrollTimeoutRef.current);
      pendingScrollTimeoutRef.current = null;
    }

    if (href.startsWith('#')) {
      if (location.pathname === '/') {
        performScroll(href);
        return;
      }

      navigate('/');
      pendingScrollTimeoutRef.current = window.setTimeout(() => {
        performScroll(href);
        pendingScrollTimeoutRef.current = null;
      }, 180);
      return;
    }

    if (href.startsWith('/')) {
      if (href === '/' && location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      navigate(href);
    }
  };

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <a className={styles.logo} href="/" onClick={e => { e.preventDefault(); scrollTo('/'); }}>
          <span className={styles.logoText}>Alcocars</span>
        </a>

        {/* Desktop Nav */}
        <nav className={styles.nav}>
          {navLinks.map(link => (
            <div key={link.label} className={styles.navItem}>
              <a
                href={link.href}
                className={styles.navLink}
                onClick={e => { e.preventDefault(); scrollTo(link.href); }}
              >
                {link.label}
              </a>
            </div>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="#hero"
          className={styles.cta}
          onClick={e => { e.preventDefault(); scrollTo('#hero'); }}
        >
          <span>Reservar</span>
        </a>

        {/* Mobile hamburger */}
        <button
          className={`${styles.burger} ${mobileOpen ? styles.burgerOpen : ''}`}
          onClick={() => setMobileOpen(p => !p)}
          aria-label="Abrir menú"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className={styles.mobileLink}
              onClick={e => { e.preventDefault(); scrollTo(link.href); }}
            >
              {link.label}
            </a>
          ))}
          <a href="#hero" className={styles.mobileCta} onClick={e => { e.preventDefault(); scrollTo('#hero'); }}>
            Reservar ahora →
          </a>
        </div>
      )}
    </header>
  );
}
