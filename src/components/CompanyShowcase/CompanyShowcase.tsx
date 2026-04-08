import { useNavigate } from 'react-router-dom';
import styles from './CompanyShowcase.module.css';

export default function CompanyShowcase() {
  const navigate = useNavigate();

  return (
    <section className={styles.section} aria-label="Instalaciones de Alcocars">
      <div className={`container ${styles.container}`}>
        <p className={styles.kicker}>Nuestra base</p>
        <h2 className={styles.title}>Alcocars en su entorno real</h2>
        <p className={styles.copy}>
          Una flota cuidada y un equipo cercano para que alquilar sea facil, rapido y sin sorpresas.
        </p>
        <button type="button" className={styles.button} onClick={() => navigate('/empresa')}>
          Conocer la empresa
        </button>
      </div>
    </section>
  );
}
