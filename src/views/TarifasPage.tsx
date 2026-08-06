'use client';

import { addDays, startOfToday } from 'date-fns';
import { buildReservaHref } from '../lib/reservaQuery';
import { readLastSearch } from '../lib/lastSearch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { extras } from '../data/extras';
import { SUPER_CATEGORIES, tariffs, type TariffEntry } from '../data/tariffs';
import styles from './TarifasPage.module.css';

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Formatea un importe en euros con coma decimal (sin decimales si es entero). */
function formatEuros(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
}

function TariffRow({ tariff }: { tariff: TariffEntry }) {
  const router = useRouter();

  if (tariff.consultOnly) {
    return (
      <tr className={styles.consultRow}>
        <th scope="row" className={styles.rowName}>
          {tariff.name}
        </th>
        <td colSpan={DAYS.length + 3} className={styles.consultCell}>
          Precio bajo consulta. Cuéntanos las fechas y te preparamos una propuesta a medida.
        </td>
        <td className={styles.actionCell}>
          <button
            type="button"
            className={`${styles.rowBtn} ${styles.rowBtnSecondary}`}
            onClick={() => router.push('/contacto')}
          >
            Contactar
          </button>
        </td>
      </tr>
    );
  }

  const handleReserve = () => {
    const lastSearch = readLastSearch();
    const from = lastSearch ? new Date(lastSearch.from) : startOfToday();
    const to = lastSearch ? new Date(lastSearch.to) : addDays(from, 1);

    router.push(
      buildReservaHref({
        location: lastSearch?.location ?? 'Zaragoza',
        tariffId: tariff.id,
        category: tariff.superCategory,
        from,
        to,
      }),
    );
  };

  return (
    <tr>
      <th scope="row" className={styles.rowName}>
        {tariff.name}
      </th>
      {DAYS.map((day) => (
        <td
          key={day}
          className={`${styles.priceCell} ${day === 7 ? styles.bestCell : ''}`}
        >
          {formatEuros(tariff.rates[day - 1])}&nbsp;€
        </td>
      ))}
      <td className={styles.dataCell}>{tariff.kmExtra.toFixed(2).replace('.', ',')}&nbsp;€/km</td>
      <td className={styles.dataCell}>{formatEuros(tariff.deposit)}&nbsp;€</td>
      <td className={styles.dataCell}>{formatEuros(tariff.franchise)}&nbsp;€</td>
      <td className={styles.actionCell}>
        <button type="button" className={styles.rowBtn} onClick={handleReserve}>
          Reservar
        </button>
      </td>
    </tr>
  );
}

function TariffTable({ category }: { category: (typeof SUPER_CATEGORIES)[number] }) {
  const entries = tariffs.filter((t) => t.superCategory === category);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{category}</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.rowName}>
                Gama
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className={day === 7 ? styles.bestHead : undefined}
                >
                  {day} {day === 1 ? 'día' : 'días'}
                  {day === 7 && <span className={styles.bestTag}>mejor €/día</span>}
                </th>
              ))}
              <th scope="col">Km extra</th>
              <th scope="col">Fianza</th>
              <th scope="col">Franquicia</th>
              <th scope="col">
                <span className="sr-only">Reservar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((tariff) => (
              <TariffRow key={tariff.id} tariff={tariff} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const INCLUDED = [
  '200 km al día incluidos en todas las gamas',
  'Seguro a todo riesgo con franquicia (300 € o 600 € según vehículo)',
  'Responsabilidad civil obligatoria y complementaria',
  'Asistencia en carretera 24 h «Viajamos Contigo», con vehículo de sustitución en caso de avería',
  'IVA incluido en todos los precios',
];

export default function TarifasPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.kicker}>Precios claros</p>
          <h1 className={styles.title}>TARIFAS</h1>
          <p className={styles.subtitle}>
            Precios cerrados por gama, con 200&nbsp;km al día, IVA y seguro a todo riesgo incluidos.
            Lo que ves es lo que pagas: sin sorpresas al devolver el vehículo.
          </p>
        </header>

        {SUPER_CATEGORIES.map((category) => (
          <TariffTable key={category} category={category} />
        ))}

        <div className={styles.infoGrid}>
          <section className={styles.infoPanel} aria-labelledby="incluye-titulo">
            <h2 id="incluye-titulo" className={styles.infoTitle}>
              Qué incluye el precio
            </h2>
            <ul className={styles.checkList}>
              {INCLUDED.map((item) => (
                <li key={item}>
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.infoPanel} aria-labelledby="extras-titulo">
            <h2 id="extras-titulo" className={styles.infoTitle}>
              Suplementos opcionales
            </h2>
            <ul className={styles.extrasList}>
              {extras.map((extra) => (
                <li key={extra.id} className={styles.extraItem}>
                  <div className={styles.extraRow}>
                    <span className={styles.extraLabel}>{extra.label}</span>
                    <span className={styles.extraPrice}>
                      {formatEuros(extra.price)}&nbsp;€{extra.unit === 'per_day' ? '/día' : ''}
                    </span>
                  </div>
                  {extra.hint && <p className={styles.extraHint}>{extra.hint}</p>}
                </li>
              ))}
            </ul>
            <p className={styles.extrasNote}>Importes con IVA incluido.</p>
          </section>
        </div>

        <section className={styles.notes}>
          <h2 className={styles.notesTitle}>Antes de reservar</h2>
          <p>
            El alquiler mínimo es de 24&nbsp;h y aplicamos un margen de cortesía de 1&nbsp;h en la
            devolución; superado ese margen, se cobra un día adicional. El vehículo se entrega con el
            depósito lleno y se devuelve lleno: si no, se cobra la diferencia de combustible más
            20&nbsp;€ + IVA por el servicio de repostaje.
          </p>
          <p>
            Tienes todo el detalle en las{' '}
            <Link href="/legal/condiciones-alquiler" className={styles.noteLink}>
              condiciones de alquiler
            </Link>{' '}
            y en nuestras{' '}
            <Link href="/faqs" className={styles.noteLink}>
              preguntas frecuentes
            </Link>
            .
          </p>
          <p className={styles.notesFine}>
            La reserva web es una solicitud, no una confirmación: el equipo responde en
            24–48&nbsp;h laborables y no se paga nada por adelantado.
          </p>
        </section>
      </div>
    </main>
  );
}
