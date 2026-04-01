import { useEffect, useRef, useState } from 'react';
import { Icon, type Marker as LeafletMarker } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { offices, type Office } from '../data/offices';
import styles from './OfficesPage.module.css';

const initialOffice = offices.find((office) => office.id === 'zaragoza') ?? offices[0];

if (!initialOffice) {
  throw new Error('No offices available in data source.');
}

const officeMarkerIcon = new Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapController({ coords }: { coords: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(coords, 14, { duration: 1.5 });
  }, [coords, map]);

  return null;
}

export default function OfficesPage() {
  const markerRefs = useRef<Record<string, LeafletMarker | null>>({});
  const [activeOffice, setActiveOffice] = useState<Office>(initialOffice);
  const activeOfficeIndex = offices.findIndex((office) => office.id === activeOffice.id);

  const goToOffice = (nextIndex: number) => {
    const normalizedIndex = (nextIndex + offices.length) % offices.length;
    const nextOffice = offices[normalizedIndex];

    if (nextOffice) {
      setActiveOffice(nextOffice);
    }
  };

  const goToPreviousOffice = () => {
    goToOffice(activeOfficeIndex - 1);
  };

  const goToNextOffice = () => {
    goToOffice(activeOfficeIndex + 1);
  };

  useEffect(() => {
    const popupTimer = window.setTimeout(() => {
      markerRefs.current[activeOffice.id]?.openPopup();
    }, 260);

    return () => {
      window.clearTimeout(popupTimer);
    };
  }, [activeOffice]);

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.listColumn} aria-label="Listado de sedes">
          <h1 className={styles.title}>NUESTRAS SEDES</h1>

          <div className={styles.officeList}>
            {offices.map((office) => {
              const isActive = activeOffice.id === office.id;

              return (
                <div
                  key={office.id}
                  className={`${styles.officeCard} ${isActive ? styles.officeCardActive : ''}`}
                  onClick={() => setActiveOffice(office)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveOffice(office);
                    }
                  }}
                >
                  <h2 className={styles.city}>{office.city}</h2>
                  <p className={styles.address}>{office.address}</p>
                  <p className={styles.phone}>{office.phone}</p>
                  <p className={styles.hours}>{office.hours}</p>
                  <p className={styles.description}>{office.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.mapColumn} aria-label="Mapa de sedes">
          <div className={styles.mobileHeaderRow}>
            <button
              type="button"
              className={styles.mobileArrowBtn}
              onClick={goToPreviousOffice}
              aria-label="Sede anterior"
            >
              <svg viewBox="0 0 20 20" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12.5 4.5 7 10l5.5 5.5" />
              </svg>
            </button>

            <h2 className={styles.mobileCityTitle}>{activeOffice.city}</h2>

            <button
              type="button"
              className={styles.mobileArrowBtn}
              onClick={goToNextOffice}
              aria-label="Siguiente sede"
            >
              <svg viewBox="0 0 20 20" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m7.5 4.5 5.5 5.5-5.5 5.5" />
              </svg>
            </button>
          </div>

          <div className={styles.mapWrap}>
            <MapContainer center={activeOffice.coords} zoom={14} scrollWheelZoom={false} className={styles.map}>
              <MapController coords={activeOffice.coords} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap contributors &copy; CARTO"
              />

              {offices.map((office) => (
                <Marker
                  key={office.id}
                  position={office.coords}
                  icon={officeMarkerIcon}
                  ref={(marker) => {
                    markerRefs.current[office.id] = marker;
                  }}
                  eventHandlers={{
                    click: () => setActiveOffice(office),
                  }}
                >
                  <Popup>
                    <strong>{office.city}</strong>
                    <br />
                    {office.address}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className={styles.mobileDots} aria-label="Selector de sedes">
            {offices.map((office) => {
              const isActive = office.id === activeOffice.id;

              return (
                <button
                  key={office.id}
                  type="button"
                  className={`${styles.mobileDot} ${isActive ? styles.mobileDotActive : ''}`}
                  onClick={() => setActiveOffice(office)}
                  aria-label={`Ir a ${office.city}`}
                  aria-current={isActive ? 'true' : undefined}
                />
              );
            })}
          </div>

          <article className={styles.mobileInfoCard} aria-label={`Información de ${activeOffice.city}`}>
            <p className={styles.mobileInfoAddress}>{activeOffice.address}</p>
            <a className={styles.mobileInfoPhone} href={`tel:${activeOffice.phone.replace(/\s+/g, '')}`}>
              {activeOffice.phone}
            </a>
            <p className={styles.mobileInfoHours}>{activeOffice.hours}</p>
            <p className={styles.mobileInfoDescription}>{activeOffice.description}</p>
          </article>
        </section>
      </div>
    </main>
  );
}
