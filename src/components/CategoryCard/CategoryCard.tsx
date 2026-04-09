import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_GROUP_LABELS, type Category } from '../../lib/categories';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  category: Category;
  onSelect?: (categoryId: string) => void;
  delay?: number;
}

function PlaceholderImage() {
  return (
    <svg
      className={styles.placeholder}
      viewBox="0 0 320 180"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="320" height="180" fill="var(--color-surface, #1a1a1a)" />
      <rect x="80" y="60" width="160" height="80" rx="8" fill="none" stroke="var(--color-border, #333)" strokeWidth="2" />
      <circle cx="120" cy="155" r="18" fill="none" stroke="var(--color-border, #333)" strokeWidth="2" />
      <circle cx="200" cy="155" r="18" fill="none" stroke="var(--color-border, #333)" strokeWidth="2" />
      <path d="M100 120 L80 140 H240 L220 120 Z" fill="none" stroke="var(--color-border, #333)" strokeWidth="2" />
    </svg>
  );
}

export function CategoryCard({ category, onSelect, delay = 0 }: CategoryCardProps) {
  const navigate = useNavigate();

  const handleReserve = () => {
    if (onSelect) {
      onSelect(category.id);
    }
    navigate('/reserva', { state: { categoryId: category.id } });
  };

  const hasSeatsRange = category.seatsMin != null && category.seatsMax != null;
  const hasPowerRange = category.powerMin != null && category.powerMax != null;

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
    >
      <div className={styles.imageWrapper}>
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <PlaceholderImage />
        )}
      </div>

      <div className={styles.body}>
        <span className={styles.badge}>{CATEGORY_GROUP_LABELS[category.group]}</span>

        <h2 className={styles.name}>{category.name}</h2>

        <div className={styles.specs}>
          {hasPowerRange && (
            <span>{category.powerMin}–{category.powerMax} cv</span>
          )}
          {hasSeatsRange && (
            <span>{category.seatsMin}–{category.seatsMax} plazas</span>
          )}
          {category.transmissions.length > 0 && (
            <span>{category.transmissions.join(' / ')}</span>
          )}
          {category.fuels.length > 0 && (
            <span>{category.fuels.join(' / ')}</span>
          )}
        </div>

        <div className={styles.price}>
          <span className={styles.priceLabel}>Desde</span>
          <span className={styles.priceAmount}>{category.price1Day}€</span>
          <span className={styles.priceUnit}>/día</span>
        </div>

        <button type="button" className={styles.cta} onClick={handleReserve}>
          Reservar →
        </button>
      </div>
    </motion.article>
  );
}
