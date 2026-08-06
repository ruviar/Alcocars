import { addDays, startOfToday } from 'date-fns';
import { readLastSearch } from '../../lib/lastSearch';
import { Link, useNavigate } from 'react-router-dom';
import { SUPER_CATEGORIES, tariffs, type SuperCategory, type TariffEntry } from '../../data/tariffs';
import pageStyles from '../../pages/FleetPage.module.css';
import styles from './FleetSection.module.css';

function mapSuperCategoryToVehicleType(category: SuperCategory): string {
  const map: Record<SuperCategory, string> = {
    Coches: 'Turismos',
    Furgonetas: 'Furgonetas',
    Todoterrenos: '4×4',
    Autocaravanas: 'Autocaravanas',
  };

  return map[category];
}

function TariffCard({ tariff }: { tariff: TariffEntry }) {
  const navigate = useNavigate();

  const handleReserve = () => {
    const lastSearch = readLastSearch();
    const from = lastSearch ? new Date(lastSearch.from) : startOfToday();
    const to = lastSearch ? new Date(lastSearch.to) : addDays(from, 1);

    navigate('/reserva', {
      state: {
        location: lastSearch?.location ?? 'Zaragoza',
        rentalCategory: mapSuperCategoryToVehicleType(tariff.superCategory),
        vehicleType: mapSuperCategoryToVehicleType(tariff.superCategory),
        superCategory: tariff.superCategory,
        tariffId: tariff.id,
        dateRange: {
          from,
          to,
        },
      },
    });
  };

  if (tariff.consultOnly) {
    return (
      <article className={pageStyles.card}>
        <div className={pageStyles.cardBody}>
          <p className={pageStyles.cardCategory}>{tariff.superCategory}</p>
          <h3 className={pageStyles.cardName}>{tariff.name}</h3>
          <p className={pageStyles.cardConsult}>Precio bajo consulta</p>
          <p className={pageStyles.cardConsultNote}>
            Contáctanos para conocer disponibilidad y tarifas.
          </p>
        </div>
        <div className={pageStyles.cardFooter}>
          <button
            type="button"
            className={`${pageStyles.ctaBtn} ${pageStyles.ctaBtnSecondary}`}
            onClick={() => navigate('/contacto')}
          >
            Contactar →
          </button>
        </div>
      </article>
    );
  }

  const pricePerDay = tariff.rates[0];

  return (
    <article className={pageStyles.card}>
      <div className={pageStyles.cardBody}>
        <p className={pageStyles.cardCategory}>{tariff.superCategory}</p>
        <h3 className={pageStyles.cardName}>{tariff.name}</h3>
        <div className={pageStyles.priceWrap}>
          <span className={pageStyles.price}>{pricePerDay}€</span>
          <span className={pageStyles.priceUnit}>/día</span>
        </div>
        <ul className={pageStyles.detailsList}>
          <li>
            <span className={pageStyles.detailDot} aria-hidden="true">·</span>
            {tariff.kmPerDay} km/día incluidos
          </li>
          <li>
            <span className={pageStyles.detailDot} aria-hidden="true">·</span>
            {tariff.kmExtra.toFixed(2).replace('.', ',')}€/km extra
          </li>
          <li>
            <span className={pageStyles.detailDot} aria-hidden="true">·</span>
            Fianza {tariff.deposit}€
          </li>
          <li>
            <span className={pageStyles.detailDot} aria-hidden="true">·</span>
            Franquicia {tariff.franchise}€
          </li>
        </ul>
      </div>
      <div className={pageStyles.cardFooter}>
        <button
          type="button"
          className={pageStyles.ctaBtn}
          onClick={handleReserve}
        >
          Reservar →
        </button>
      </div>
    </article>
  );
}

export default function FleetSection() {
  const featuredTariffs = SUPER_CATEGORIES
    .map((category) => (
      tariffs.find((tariff) => tariff.superCategory === category && !tariff.consultOnly)
      ?? tariffs.find((tariff) => tariff.superCategory === category)
      ?? null
    ))
    .filter((tariff): tariff is TariffEntry => Boolean(tariff));

  return (
    <section id="flota" className={styles.section}>
      <div className={pageStyles.container}>
        <header className={pageStyles.header}>
          <p className={pageStyles.kicker}>Destacados</p>
          <h2 className={pageStyles.title}>LO MÁS RELEVANTE</h2>
          <p className={pageStyles.subtitle}>
            Te mostramos una selección rápida con las gamas más solicitadas.
            Si quieres ver todos los modelos y tarifas, puedes abrir el catálogo completo.
          </p>
        </header>

        <section className={pageStyles.section}>
          <div className={pageStyles.grid}>
            {featuredTariffs.map((tariff) => (
              <TariffCard key={tariff.id} tariff={tariff} />
            ))}
          </div>
        </section>

        <div className={styles.sectionActions}>
          <p className={styles.sectionHint}>¿Necesitas comparar todas las opciones de la flota?</p>
          <Link to="/flota" className={styles.allFleetButton}>
            Ver flota completa
          </Link>
        </div>

        <p className={pageStyles.disclaimer}>
          * Precios desde, con IVA incluido. El total exacto depende del número de días, kilómetros
          previstos y extras seleccionados. La reserva está sujeta a disponibilidad y confirmación
          en un plazo de 24–48 h laborables.
        </p>
      </div>
    </section>
  );
}
