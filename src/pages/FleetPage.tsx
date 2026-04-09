import { addDays, startOfToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { SUPER_CATEGORIES, tariffs, type TariffEntry } from '../data/tariffs';
import styles from './FleetPage.module.css';

function mapSuperCategoryToVehicleType(category: string): string {
  if (category === 'Coches') return 'Turismos';
  if (category === 'Furgonetas') return 'Furgonetas';
  if (category === 'Todoterrenos') return '4×4';
  if (category === 'Autocaravanas') return 'Autocaravanas';
  return 'Cualquier gama';
}

function TariffCard({ tariff }: { tariff: TariffEntry }) {
  const navigate = useNavigate();

  if (tariff.consultOnly) {
    return (
      <article className={styles.card}>
        <div className={styles.cardBody}>
          <p className={styles.cardCategory}>{tariff.superCategory}</p>
          <h3 className={styles.cardName}>{tariff.name}</h3>
          <p className={styles.cardConsult}>Precio bajo consulta</p>
          <p className={styles.cardConsultNote}>
            Contáctanos para conocer disponibilidad y tarifas.
          </p>
        </div>
        <div className={styles.cardFooter}>
          <button
            type="button"
            className={`${styles.ctaBtn} ${styles.ctaBtnSecondary}`}
            onClick={() => navigate('/contacto')}
          >
            Contactar →
          </button>
        </div>
      </article>
    );
  }

  const pricePerDay = tariff.rates[0];

  const handleReserve = () => {
    const from = startOfToday();

    navigate('/reserva', {
      state: {
        location: 'Zaragoza',
        rentalCategory: mapSuperCategoryToVehicleType(tariff.superCategory),
        vehicleType: mapSuperCategoryToVehicleType(tariff.superCategory),
        superCategory: tariff.superCategory,
        tariffId: tariff.id,
        dateRange: {
          from,
          to: addDays(from, 1),
        },
      },
    });
  };

  return (
    <article className={styles.card}>
      <div className={styles.cardBody}>
        <p className={styles.cardCategory}>{tariff.superCategory}</p>
        <h3 className={styles.cardName}>{tariff.name}</h3>
        <div className={styles.priceWrap}>
          <span className={styles.price}>{pricePerDay}€</span>
          <span className={styles.priceUnit}>/día</span>
        </div>
        <ul className={styles.detailsList}>
          <li>
            <span className={styles.detailDot} aria-hidden="true">·</span>
            {tariff.kmPerDay} km/día incluidos
          </li>
          <li>
            <span className={styles.detailDot} aria-hidden="true">·</span>
            {tariff.kmExtra.toFixed(2).replace('.', ',')}€/km extra
          </li>
          <li>
            <span className={styles.detailDot} aria-hidden="true">·</span>
            Fianza {tariff.deposit}€
          </li>
          <li>
            <span className={styles.detailDot} aria-hidden="true">·</span>
            Franquicia {tariff.franchise}€
          </li>
        </ul>
      </div>
      <div className={styles.cardFooter}>
        <button
          type="button"
          className={styles.ctaBtn}
          onClick={handleReserve}
        >
          Reservar →
        </button>
      </div>
    </article>
  );
}

export default function FleetPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.kicker}>Tarifas y disponibilidad</p>
          <h1 className={styles.title}>NUESTRA FLOTA</h1>
          <p className={styles.subtitle}>
            Elige la gama que se adapta a tu necesidad. Precios por día con 200&nbsp;km incluidos.
            Sin costes ocultos.
          </p>
        </header>

        {SUPER_CATEGORIES.map((cat) => {
          const entries = tariffs.filter((t) => t.superCategory === cat);
          return (
            <section key={cat} className={styles.section}>
              <h2 className={styles.sectionTitle}>{cat}</h2>
              <div className={styles.grid}>
                {entries.map((tariff) => (
                  <TariffCard key={tariff.id} tariff={tariff} />
                ))}
              </div>
            </section>
          );
        })}

        <p className={styles.disclaimer}>
          * Precios desde. El total exacto depende del número de días, kilómetros previstos y extras
          seleccionados. La reserva está sujeta a disponibilidad y confirmación en un plazo de
          24–48&nbsp;h.
        </p>
      </div>
    </main>
  );
}
