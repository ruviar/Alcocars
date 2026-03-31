import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { vehicles, type Vehicle } from '../../data/vehicles';
import styles from './FleetSection.module.css';

gsap.registerPlugin(ScrollTrigger);

const filters: Vehicle['category'][] = ['Turismos', 'Furgonetas', '4x4', 'Autocaravanas'];

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
  const [activeFilter, setActiveFilter] = useState<Vehicle['category']>('Turismos');

  const filteredVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.category === activeFilter),
    [activeFilter],
  );

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
  }, [activeFilter]);

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

        <div className={styles.grid}>
          {filteredVehicles.map((vehicle) => (
            <article key={vehicle.id} className={styles.card}>
              <div className={styles.media}>
                <img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.name}`} loading="lazy" />
                <span className={styles.badge}>{vehicle.highlight}</span>
              </div>

              <div className={styles.content}>
                <div className={styles.rowTop}>
                  <p className={styles.brand}>{vehicle.brand}</p>
                  <p className={styles.rate}>
                    {vehicle.dailyRate}EUR <span>/dia</span>
                  </p>
                </div>

                <h3 className={styles.name}>{vehicle.name}</h3>
                <p className={styles.category}>{vehicle.category}</p>

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
                    <span>{vehicle.fuel}</span>
                  </li>
                  <li>
                    <FeatureIcon type="transmission" />
                    <span>{vehicle.transmission}</span>
                  </li>
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
