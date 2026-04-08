import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, startOfToday } from 'date-fns';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import { useVehicles, type ApiVehicle } from '../../hooks/useVehicles';
import styles from './FleetSection.module.css';

gsap.registerPlugin(ScrollTrigger);

type FleetFilter = 'Turismos' | 'Furgonetas' | '4x4' | 'Autocaravanas';

const filters: FleetFilter[] = ['Turismos', 'Furgonetas', '4x4', 'Autocaravanas'];

const UI_TO_API_CATEGORY: Record<FleetFilter, string> = {
  Turismos: 'TURISMOS',
  Furgonetas: 'FURGONETAS',
  '4x4': 'SUV_4X4',
  Autocaravanas: 'AUTOCARAVANAS',
};

const API_TO_UI_CATEGORY: Record<string, FleetFilter> = {
  TURISMOS: 'Turismos',
  FURGONETAS: 'Furgonetas',
  SUV_4X4: '4x4',
  AUTOCARAVANAS: 'Autocaravanas',
};

function formatFuel(value: string): string {
  const map: Record<string, string> = {
    GASOLINA: 'Gasolina',
    DIESEL: 'Diesel',
    ELECTRICO: 'Electrico',
    HIBRIDO: 'Hibrido',
  };
  return map[value] ?? value;
}

function formatTransmission(value: string): string {
  const map: Record<string, string> = {
    MANUAL: 'Manual',
    AUTOMATICO: 'Automatico',
  };
  return map[value] ?? value;
}

function FeatureIcon({ type }: { type: 'seats' | 'power' | 'fuel' | 'transmission' }) {
  if (type === 'seats') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.31 0-6 1.79-6 4v2h12v-2c0-2.21-2.69-4-6-4Z" />
      </svg>
    );
  }

  if (type === 'power') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z" />
      </svg>
    );
  }

  if (type === 'fuel') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 2h-8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4h1a2 2 0 0 0 2-2v-3.5L19.5 6H18V4a2 2 0 0 0-2-2Zm-8 2h8v14h-8Zm10.5 6H20v2h-1V9.5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Zm9 4-2.12-.69.36-2.2-2.02-1.17-1.61 1.53-2.04-.84L13 6h-2l-.57 2.63-2.04.84-1.61-1.53-2.02 1.17.36 2.2L3 12l2.12.69-.36 2.2 2.02 1.17 1.61-1.53 2.04.84L11 18h2l.57-2.63 2.04-.84 1.61 1.53 2.02-1.17-.36-2.2Z" />
    </svg>
  );
}

export default function FleetSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeFilter, setActiveFilter] = useState<FleetFilter>('Turismos');
  const navigate = useNavigate();

  const startDate = startOfToday();
  const endDate = addDays(startDate, 1);
  const category = UI_TO_API_CATEGORY[activeFilter];

  const { vehicles, isLoading, error } = useVehicles({
    officeSlug: 'zaragoza',
    startDate: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
    endDate: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`,
    category,
  });

  const filteredVehicles = useMemo(
    () => vehicles ?? [],
    [vehicles],
  );

  const handleReserve = (categoryValue: string) => {
    const from = startOfToday();
    const uiCategory = API_TO_UI_CATEGORY[categoryValue] ?? 'Turismos';

    navigate('/reserva', {
      state: {
        location: 'Zaragoza',
        vehicleType: uiCategory === '4x4' ? '4×4' : uiCategory,
        dateRange: {
          from,
          to: addDays(from, 1),
        },
      },
    });
  };

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.card}`);

      if (!cards.length) {
        return;
      }

      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 48, scale: 0.98 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: section,
            start: 'top 78%',
          },
        },
      );
    }, section);

    return () => ctx.revert();
  }, [activeFilter, filteredVehicles.length]);

  return (
    <section ref={sectionRef} id="flota" className={styles.section}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <p className={styles.kicker}>Catalogo interactivo</p>
          <h2 className={styles.title}>La flota que impulsa cada plan</h2>
          <p className={styles.subtitle}>
            Filtra en tiempo real y descubre el vehiculo ideal para ciudad, trabajo o aventura.
          </p>
        </div>

        <div className={styles.filters} role="tablist" aria-label="Categorias de flota">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter}
              className={`${styles.filter} ${activeFilter === filter ? styles.filterActive : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {isLoading && <p className={styles.statusText}>Cargando vehículos...</p>}
        {error && !isLoading && <p className={styles.errorText}>Error al cargar vehículos: {error}</p>}

        <div className={styles.grid}>
          {isLoading && Array.from({ length: 4 }).map((_, index) => (
            <article key={`fleet-skeleton-${index}`} className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
              <div className={styles.media} />
              <div className={styles.content}>
                <div className={styles.skeletonLine} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineLg}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineSm}`} />
              </div>
            </article>
          ))}

          {!isLoading && !error && filteredVehicles.map((vehicle: ApiVehicle) => (
            <article key={vehicle.id} className={styles.card}>
              <div className={styles.media}>
                <img src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`} loading="lazy" />
                <span className={styles.badge}>{vehicle.highlight}</span>
              </div>

              <div className={styles.content}>
                <div className={styles.rowTop}>
                  <p className={styles.brand}>{vehicle.brand}</p>
                  <p className={styles.rate}>
                    {vehicle.dailyRate}EUR <span>/dia</span>
                  </p>
                </div>

                <h3 className={styles.name}>{vehicle.model}</h3>
                <p className={styles.category}>{API_TO_UI_CATEGORY[vehicle.category] ?? vehicle.category}</p>

                <ul className={styles.features}>
                  <li>
                    <FeatureIcon type="seats" />
                    <span>{vehicle.seats} plazas</span>
                  </li>
                  <li>
                    <FeatureIcon type="power" />
                    <span>{vehicle.power}</span>
                  </li>
                  <li>
                    <FeatureIcon type="fuel" />
                    <span>{formatFuel(vehicle.fuelType)}</span>
                  </li>
                  <li>
                    <FeatureIcon type="transmission" />
                    <span>{formatTransmission(vehicle.transmissionType)}</span>
                  </li>
                </ul>

                <div className={styles.cardFooter}>
                  <button
                    type="button"
                    className={styles.reserveButton}
                    onClick={() => handleReserve(vehicle.category)}
                  >
                    Reservar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!isLoading && !error && filteredVehicles.length === 0 && (
          <p className={styles.statusText}>No hay vehículos disponibles ahora mismo para este filtro.</p>
        )}
      </div>
    </section>
  );
}
