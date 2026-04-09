import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCategories } from '../hooks/useCategories';
import { CATEGORY_GROUPS, CATEGORY_GROUP_LABELS, type CategoryGroup } from '../lib/categories';
import { CategoryCard } from '../components/CategoryCard/CategoryCard';
import styles from './CategoriesPage.module.css';

export default function CategoriesPage() {
  const { data: categories, loading, error } = useCategories();
  const [activeGroup, setActiveGroup] = useState<CategoryGroup | 'TODOS'>('TODOS');

  const filtered = categories
    ? activeGroup === 'TODOS'
      ? categories
      : categories.filter((c) => c.group === activeGroup)
    : [];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Nuestra flota
        </motion.h1>
        <motion.p
          className={styles.subtitle}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Elige la gama que mejor se adapta a tus necesidades
        </motion.p>
      </section>

      {/* Filtro por grupo */}
      <section className={styles.filters}>
        <button
          type="button"
          className={`${styles.chip} ${activeGroup === 'TODOS' ? styles.chipActive : ''}`}
          onClick={() => setActiveGroup('TODOS')}
        >
          Todos
        </button>
        {CATEGORY_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            className={`${styles.chip} ${activeGroup === g ? styles.chipActive : ''}`}
            onClick={() => setActiveGroup(g)}
          >
            {CATEGORY_GROUP_LABELS[g]}
          </button>
        ))}
      </section>

      {/* Grid */}
      {loading && <p className={styles.loading}>Cargando categorías...</p>}
      {error && <p className={styles.error}>Error al cargar la flota. Inténtalo de nuevo.</p>}
      {!loading && !error && (
        <section className={styles.grid}>
          <AnimatePresence mode="popLayout">
            {filtered.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} delay={i * 0.05} />
            ))}
          </AnimatePresence>
        </section>
      )}
    </main>
  );
}
