'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './CookieBanner.module.css';

const COOKIE_CONSENT_KEY = 'alcocars.cookie-consent.v1';

export default function CookieBanner() {
  // Oculto en el HTML del servidor; tras montar se decide leyendo localStorage.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(COOKIE_CONSENT_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización con localStorage tras hidratar
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
        Este sitio solo utiliza almacenamiento técnico imprescindible para funcionar; no usamos
        cookies de publicidad ni de seguimiento. Más detalles en la{' '}
        <Link className={styles.link} href="/legal/politica-cookies">
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
