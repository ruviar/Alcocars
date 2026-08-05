import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import styles from './BlogPage.module.css';

export default function BlogPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.kicker}>De interés</p>
          <h1 className={styles.title}>BLOG</h1>
          <p className={styles.subtitle}>
            Guías rápidas, novedades de movilidad y recomendaciones para sacar el máximo partido a
            cada reserva.
          </p>
        </header>

        <section className={styles.grid} aria-label="Artículos del blog">
          {blogPosts.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className={styles.card}>
              <div className={styles.media}>
                <img src={post.image} alt={post.title} loading="lazy" />
                <span className={styles.category}>{post.category}</span>
              </div>

              <div className={styles.content}>
                <p className={styles.meta}>
                  <span>{post.date}</span>
                  <span>{post.readingTime}</span>
                </p>
                <h2 className={styles.cardTitle}>{post.title}</h2>
                <p className={styles.excerpt}>{post.excerpt}</p>

                <span className={styles.readMoreButton}>Leer artículo →</span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
