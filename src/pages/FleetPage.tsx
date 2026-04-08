import { useMemo, useState } from 'react';
import { addDays, format, startOfToday } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVehicles, type ApiVehicle } from '../hooks/useVehicles';
import styles from './FleetPage.module.css';

type BadgeType = 'seats' | 'transmission' | 'fuel';

function BadgeIcon({ type }: { type: BadgeType }) {
  if (type === 'seats') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 11V7a3 3 0 0 1 6 0v4" />
        <path d="M5 13h14v6H5z" />
        <path d="M7 19v2M17 19v2" />
      </svg>
    );
  }

  if (type === 'transmission') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="7" cy="7" r="2" />
        <circle cx="17" cy="7" r="2" />
        <circle cx="12" cy="17" r="2" />
        <path d="M7 9v5m10-5v5M7 12h10m-5 0v3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3h-4a2 2 0 0 0-2 2v9h8V5a2 2 0 0 0-2-2Z" />
      <path d="M16 8h2a2 2 0 0 1 2 2v3h-4" />
      <path d="M9 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}

export default function FleetPage() {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const navigate = useNavigate();

  const categories = ['Todos', 'Turismos', 'Furgonetas', '4x4', 'Autocaravanas'];
  const apiCategoryMap: Record<string, string | undefined> = {
    Todos: undefined,
    Turismos: 'TURISMOS',
    Furgonetas: 'FURGONETAS',
    '4x4': 'SUV_4X4',
    Autocaravanas: 'AUTOCARAVANAS',
  };
  const uiCategoryMap: Record<string, string> = {
    TURISMOS: 'Turismos',
    FURGONETAS: 'Furgonetas',
    SUV_4X4: '4x4',
    AUTOCARAVANAS: 'Autocaravanas',
  };

  const from = startOfToday();
  const to = addDays(from, 1);
  const { vehicles, isLoading, error } = useVehicles({
    officeSlug: 'zaragoza',
    startDate: format(from, 'yyyy-MM-dd'),
    endDate: format(to, 'yyyy-MM-dd'),
    category: apiCategoryMap[activeCategory],
  });

  const filteredVehicles = useMemo(() => {
    return vehicles ?? [];
  }, [vehicles]);

  const handleReserve = (vehicle: ApiVehicle) => {
    navigate('/reserva', {
      state: {
        location: vehicle.office.city,
        vehicleType: uiCategoryMap[vehicle.category] === '4x4' ? '4×4' : uiCategoryMap[vehicle.category],
        dateRange: {
          from,
          to,
        },
      },
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.kicker}>Catalogo Premium</p>
          <h1 className={styles.title}>NUESTRA FLOTA</h1>
          <p className={styles.subtitle}>
            Encuentra el vehiculo ideal para ciudad, negocio o aventura y reserva en segundos.
          </p>
        </header>

        <nav className={styles.filters} aria-label="Filtros de categorias de flota">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`${styles.chip} ${activeCategory === category ? styles.chipActive : ''}`}
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </nav>

        {isLoading && <p className={styles.statusText}>Cargando vehículos...</p>}
        {error && !isLoading && <p className={styles.errorText}>Error al cargar vehículos: {error}</p>}

        <motion.section layout className={styles.grid} aria-live="polite">
          {isLoading && Array.from({ length: 6 }).map((_, index) => (
            <article key={`fleet-page-skeleton-${index}`} className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
              <div className={styles.media} />
              <div className={styles.content}>
                <div className={styles.skeletonLine} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineLg}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineSm}`} />
              </div>
            </article>
          ))}

          <AnimatePresence mode="popLayout">
            {!isLoading && !error && filteredVehicles.map((vehicle) => (
              <motion.article
                key={vehicle.id}
                layout
                className={styles.card}
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <div className={styles.media}>
                  <img src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`} loading="lazy" />
                </div>

                <div className={styles.content}>
                  <p className={styles.brand}>{vehicle.brand}</p>
                  <h2 className={styles.name}>{vehicle.model}</h2>

                  <div className={styles.badges}>
                    <span className={styles.badge}>
                      <BadgeIcon type="seats" />
                      <span>{vehicle.seats} plazas</span>
                    </span>
                    <span className={styles.badge}>
                      <BadgeIcon type="transmission" />
                      <span>{vehicle.transmissionType}</span>
                    </span>
                    <span className={styles.badge}>
                      <BadgeIcon type="fuel" />
                      <span>{vehicle.fuelType}</span>
                    </span>
                  </div>

                  <div className={styles.footer}>
                    <p className={styles.rate}>
                      {vehicle.dailyRate} EUR <span>/dia</span>
                    </p>
                    <button type="button" className={styles.reserveButton} onClick={() => handleReserve(vehicle)}>
                      Reservar
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.section>

        {!isLoading && !error && filteredVehicles.length === 0 && (
          <p className={styles.statusText}>No hay vehículos disponibles para este filtro y fecha.</p>
        )}
      </div>
    </main>
  );
}
