import Link from 'next/link';
import type { LegalDocument } from '../data/legalContent';
import styles from './LegalPage.module.css';

export default function LegalPage({ legalDoc }: { legalDoc: LegalDocument | undefined }) {
  if (!legalDoc) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <article className={styles.notFoundCard}>
            <h1 className={styles.title}>Documento no disponible</h1>
            <p className={styles.intro}>
              No encontramos el documento legal solicitado. Puedes volver al inicio o consultar las secciones
              disponibles desde el pie de página.
            </p>
            <Link className={styles.homeButton} href="/">
              Volver al inicio
            </Link>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <article className={styles.card}>
          <p className={styles.updated}>Actualizado: {legalDoc.updatedAt}</p>
          <h1 className={styles.title}>{legalDoc.title}</h1>
          <p className={styles.intro}>{legalDoc.intro}</p>

          <div className={styles.content}>
            {legalDoc.sections.map((section) => (
              <section key={section.heading} className={styles.section}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
