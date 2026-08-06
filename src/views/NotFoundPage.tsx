import Link from 'next/link';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-label="Página no encontrada">
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Ruta fuera del mapa</h1>
        <p className={styles.text}>
          La dirección que buscas no existe o se ha movido. Puedes volver al inicio o ir directamente a la flota y las tarifas.
        </p>
        <Link className={styles.button} href="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
