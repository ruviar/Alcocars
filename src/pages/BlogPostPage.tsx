import { Link, Navigate, useParams } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import styles from './BlogPostPage.module.css';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((entry) => entry.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const related = blogPosts.filter((entry) => entry.slug !== post.slug).slice(0, 2);

  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <div className={styles.container}>
          <header className={styles.header}>
            <Link to="/blog" className={styles.backLink}>
              ← Volver al blog
            </Link>
            <p className={styles.kicker}>
              <span className={styles.kickerCategory}>{post.category}</span>
              <span aria-hidden="true">·</span>
              <span>{post.date}</span>
              <span aria-hidden="true">·</span>
              <span>{post.readingTime} de lectura</span>
            </p>
            <h1 className={styles.title}>{post.title}</h1>
            <p className={styles.lead}>{post.excerpt}</p>
          </header>

          <figure className={styles.hero}>
            <img src={post.image} alt={post.title} />
          </figure>

          <div className={styles.body}>
            {post.sections.map((section, index) => (
              <section key={section.heading ?? `section-${index}`} className={styles.section}>
                {section.heading && <h2 className={styles.sectionHeading}>{section.heading}</h2>}
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className={styles.paragraph}>
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </article>

      <aside className={styles.readMore} aria-label="Artículos relacionados">
        <div className={styles.container}>
          <p className={styles.readMoreKicker}>Sigue leyendo</p>
          <div className={styles.relatedGrid}>
            {related.map((entry) => (
              <Link key={entry.slug} to={`/blog/${entry.slug}`} className={styles.relatedCard}>
                <div className={styles.relatedMedia}>
                  <img src={entry.image} alt={entry.title} loading="lazy" />
                </div>
                <div className={styles.relatedContent}>
                  <p className={styles.relatedMeta}>
                    {entry.category} · {entry.date}
                  </p>
                  <h3 className={styles.relatedTitle}>{entry.title}</h3>
                  <span className={styles.relatedLink}>Leer artículo →</span>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.cta}>
            <div className={styles.ctaText}>
              <h2 className={styles.ctaTitle}>¿TE LLEVAMOS DE VIAJE?</h2>
              <p className={styles.ctaSubtitle}>
                Solicita tu vehículo online y te confirmamos disponibilidad en 24–48 horas
                laborables. Sin pago por adelantado.
              </p>
            </div>
            <Link to="/reserva" className={styles.ctaButton}>
              Reservar ahora →
            </Link>
          </div>
        </div>
      </aside>
    </main>
  );
}
