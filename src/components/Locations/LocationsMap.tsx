import { useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { offices, type Office } from '../../data/offices';
import styles from './LocationsMap.module.css';

const accentColor = '#8FBE2F';
const mutedColor = '#7E8799';

function FlyToOffice({ office }: { office: Office }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(office.coords, 10, {
      duration: 1.4,
      easeLinearity: 0.2,
    });
  }, [map, office]);

  return null;
}

export default function LocationsMap() {
  const [selectedId, setSelectedId] = useState<string>(offices[0].id);

  const selectedOffice = useMemo(
    () => offices.find((office) => office.id === selectedId) ?? offices[0],
    [selectedId],
  );

  return (
    <section id="sedes" className={styles.section}>
      <div className={`container ${styles.layout}`}>
        <aside className={styles.panel}>
          <p className={styles.kicker}>Sedes reales</p>
          <h2 className={styles.title}>Tu base local en cada ciudad</h2>

          <ul className={styles.officeList}>
            {offices.map((office) => {
              const isActive = selectedOffice.id === office.id;

              return (
                <li key={office.id}>
                  <button
                    type="button"
                    className={`${styles.officeButton} ${isActive ? styles.active : ''}`}
                    onClick={() => setSelectedId(office.id)}
                  >
                    <span className={styles.city}>{office.city}</span>
                    <span className={styles.address}>{office.address}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <article className={styles.infoCard}>
            <h3>{selectedOffice.city}</h3>
            <p>{selectedOffice.description}</p>
            <ul>
              <li>
                <strong>Horario:</strong> {selectedOffice.hours}
              </li>
              <li>
                <strong>Telefono:</strong> {selectedOffice.phone}
              </li>
              <li>
                <strong>Email:</strong> {selectedOffice.email}
              </li>
            </ul>
          </article>
        </aside>

        <div className={styles.mapWrap}>
          <MapContainer
            center={selectedOffice.coords}
            zoom={9}
            minZoom={6}
            scrollWheelZoom={false}
            className={styles.map}
          >
            <FlyToOffice office={selectedOffice} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />

            {offices.map((office) => {
              const isActive = office.id === selectedOffice.id;

              return (
                <CircleMarker
                  key={office.id}
                  center={office.coords}
                  radius={isActive ? 11 : 8}
                  pathOptions={{
                    color: isActive ? accentColor : mutedColor,
                    fillColor: isActive ? accentColor : mutedColor,
                    fillOpacity: isActive ? 0.8 : 0.45,
                    weight: isActive ? 2 : 1,
                  }}
                  eventHandlers={{
                    click: () => setSelectedId(office.id),
                  }}
                >
                  <Popup>
                    <strong>{office.city}</strong>
                    <br />
                    {office.address}
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </section>
  );
}
