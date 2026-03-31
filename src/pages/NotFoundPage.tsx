import { useNavigate } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-label="Pagina no encontrada">
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Ruta fuera del mapa</h1>
        <p className={styles.text}>
          La direccion que buscas no existe o se ha movido. Nuestro coche de referencia ya va en otra direccion,
          pero puedes volver al inicio en un clic.
        </p>
        <button type="button" className={styles.button} onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </section>
    </main>
  );
}
