import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './CookieBanner.module.css';

const COOKIE_CONSENT_KEY = 'alcocars.cookie-consent.v1';

export default function CookieBanner() {
  // Estado inicial leído de localStorage de forma perezosa: sin efecto ni doble render.
  const [isVisible, setIsVisible] = useState(
    () => !window.localStorage.getItem(COOKIE_CONSENT_KEY),
  );

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
        Este sitio solo utiliza almacenamiento técnico imprescindible para funcionar; no usamos
        cookies de publicidad ni de seguimiento. Más detalles en la{' '}
        <Link className={styles.link} to="/legal/politica-cookies">
          política de cookies
        </Link>
        .
      </p>

      <button type="button" className={styles.button} onClick={handleAccept}>
        Entendido
      </button>
    </aside>
  );
}
