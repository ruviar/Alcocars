import { useLocation } from 'react-router-dom';
import { company } from '../../data/offices';
import styles from './WhatsAppFab.module.css';

const PREFILLED_MESSAGE = 'Hola, me interesa recibir información sobre alquiler y renting.';

/**
 * Botón flotante de WhatsApp visible en toda la web.
 * Se oculta en el checkout para no tapar los botones del asistente de reserva.
 */
export default function WhatsAppFab() {
  const location = useLocation();

  if (location.pathname.startsWith('/reserva')) {
    return null;
  }

  const href = `https://wa.me/${company.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    PREFILLED_MESSAGE,
  )}`;

  return (
    <a
      className={styles.fab}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Abrir chat de WhatsApp con Alcocars (${company.whatsapp})`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
        <path
          fill="currentColor"
          d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.33 4.95L2 22l5.3-1.39a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9a9.83 9.83 0 0 0-2.9-7 9.83 9.83 0 0 0-7.01-2.92Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-3.53 4.44c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.9 2.4 1.02 2.57.12.16 1.72 2.62 4.16 3.68 2.03.87 2.45.7 2.89.66.44-.04 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.47-.28-.24-.13-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.25-.62.78-.76.94-.14.16-.28.18-.52.06a6.57 6.57 0 0 1-1.94-1.2 7.27 7.27 0 0 1-1.34-1.67c-.14-.24-.01-.37.11-.5.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.43-.06-.12-.54-1.32-.76-1.8-.2-.48-.4-.42-.55-.42h-.47Z"
        />
      </svg>
      <span className={styles.label}>WhatsApp</span>
    </a>
  );
}
