import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './CookieBanner.module.css';

const COOKIE_CONSENT_KEY = 'alcocars.cookie-consent.v1';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consentValue = window.localStorage.getItem(COOKIE_CONSENT_KEY);

    if (!consentValue) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside className={styles.banner} role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <p className={styles.text}>
        Usamos cookies para mejorar tu experiencia y analizar el uso del sitio. Consulta nuestra{' '}
        <Link className={styles.link} to="/legal/politica-cookies">
          Politica de Cookies
        </Link>
        .
      </p>

      <button type="button" className={styles.button} onClick={handleAccept}>
        Aceptar
      </button>
    </aside>
  );
}
