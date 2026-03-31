import { Link } from 'react-router-dom';
import { offices } from '../../data/offices';
import styles from './Footer.module.css';

const quickLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Nuestra Flota', to: '/flota' },
  { label: 'Servicios', to: '/servicios' },
  { label: 'Quiénes Somos', to: '/empresa' },
];

const interestLinks = [
  { label: 'Renting Flexible', to: '/servicios' },
  { label: 'Alquiler por horas', to: '/servicios' },
  { label: 'Vehículos adaptados', to: '/flota' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contacto', to: '/contacto' },
];

const legalLinks = [
  { label: 'Aviso Legal', to: '/legal/aviso-legal' },
  { label: 'Política de Privacidad', to: '/legal/politica-privacidad' },
  { label: 'Condiciones de Alquiler', to: '/legal/condiciones-alquiler' },
  { label: 'Política de Cookies', to: '/legal/politica-cookies' },
];

const localOffices = offices.filter(office =>
  ['Zaragoza', 'Tudela', 'Soria'].includes(office.city),
);

function PhoneIcon() {
  return (
    <svg className={styles.phoneIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.62 10.79a15.54 15.54 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.08 11.08 0 0 0 3.48.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.4 21 3 13.6 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.38.56 3.48a1 1 0 0 1-.24 1.01l-2.2 2.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.grid}>
          <div className={styles.brandColumn}>
            <Link to="/" className={styles.logo} aria-label="Ir al inicio de Alcocars">
              <span className={styles.logoMark}>AC</span>
              <span className={styles.logoText}>Alcocars</span>
            </Link>

            <p className={styles.brandText}>
              Soluciones de movilidad premium y renting flexible para empresas y particulares en Aragón y Navarra.
            </p>
          </div>

          <div className={styles.navColumn}>
            <p className={styles.colTitle}>Navegación</p>
            <ul className={styles.navList}>
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link className={styles.footerLink} to={link.to}>
                    <span className={styles.linkAccent} aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.interestColumn}>
            <p className={styles.colTitle}>De Interés</p>
            <ul className={styles.interestList}>
              {interestLinks.map(link => (
                <li key={link.label}>
                  <Link className={styles.footerLink} to={link.to}>
                    <span className={styles.linkAccent} aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.contactColumn}>
            <p className={styles.colTitle}>Contacto Local</p>
            <ul className={styles.contactList}>
              {localOffices.map(office => (
                <li key={office.id} className={styles.officeItem}>
                  <strong>{office.city}</strong>
                  <a
                    className={styles.phoneLink}
                    href={`tel:${office.phone.replace(/\s+/g, '')}`}
                    aria-label={`Llamar a la oficina de ${office.city}`}
                  >
                    <PhoneIcon />
                    <span>{office.phone}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.legalBar}>
          <p className={styles.copyright}>© 2026 Alcocars. Todos los derechos reservados.</p>

          <ul className={styles.legalLinks}>
            {legalLinks.map(link => (
              <li key={link.label}>
                <Link to={link.to} className={styles.legalLink}>
                  <span className={styles.linkAccent} aria-hidden="true" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
