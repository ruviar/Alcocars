/**
 * Oficinas reales de Alcocars.
 *
 * Copia editorial de `server/src/config/company.ts` (la fuente de verdad que
 * alimenta la base de datos y los emails). Si cambias algo aquí, cámbialo
 * también allí.
 *
 * Pendiente de confirmar con el cliente:
 *   · Teléfono directo de Tudela (se usa el central de Zaragoza).
 *   · Coordenadas exactas de cada oficina (las actuales son aproximadas a
 *     partir de la dirección postal).
 */

export interface Office {
  id: string;
  city: string;
  /** provincia o comunidad, para mostrar «Ágreda (Soria)» */
  region: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  coords: [number, number]; // [lat, lng]
  description: string;
}

export const offices: Office[] = [
  {
    id: 'zaragoza',
    city: 'Zaragoza',
    region: 'Aragón',
    address: 'Ctra. de Logroño, km 6,4 — local 1, Polígono El Portazgo (frente a Pikolin), 50011 Zaragoza',
    phone: '976 106 100',
    email: 'zaragoza@alcocars.es',
    hours: 'Lun–Vie 9:00–13:00 y 16:00–19:00 · Sáb 9:00–12:30',
    coords: [41.6835, -0.9339],
    description:
      'Nuestra oficina principal, a pie de la N-232 y con salida directa a la A-68 y la Z-40. Es la base desde la que damos servicio al aeropuerto de Zaragoza.',
  },
  {
    id: 'tudela',
    city: 'Tudela',
    region: 'Navarra',
    address: 'Av. de Zaragoza, 46, 31500 Tudela (Navarra)',
    phone: '976 106 100',
    email: 'tudela@alcocars.es',
    hours: 'Lun–Vie 9:00–13:00 y 16:00–19:00 · Sáb 9:00–12:30',
    coords: [42.0602, -1.604],
    description:
      'Nuestra puerta de entrada a la Ribera Navarra y La Rioja, en plena Avenida de Zaragoza y a cinco minutos de la AP-15.',
  },
  {
    id: 'agreda',
    city: 'Ágreda',
    region: 'Soria',
    address: 'Ctra. N-122, km 105, 42100 Ágreda (Soria)',
    phone: '976 646 868',
    email: 'agreda@alcocars.es',
    hours: 'Lun–Vie 9:00–13:00 y 16:00–19:00 · Sáb 9:00–12:30',
    coords: [41.8464, -1.9686],
    description:
      'En el kilómetro 105 de la N-122, junto a las instalaciones de Alcotrans. El punto natural para moverse entre Soria, el Moncayo y la Ribera.',
  },
];

/** Etiqueta corta para selectores: «Ágreda (Soria)», «Zaragoza»… */
export function officeLabel(office: Office): string {
  return office.city === office.region ? office.city : `${office.city} (${office.region})`;
}

export function officeBySlug(slug: string): Office | undefined {
  return offices.find((office) => office.id === slug);
}

/** Resuelve el slug a partir del nombre de ciudad que circula por la navegación. */
export function officeSlugByCity(city: string | undefined): string {
  if (!city) return offices[0].id;
  const normalized = city.trim().toLowerCase();
  const match = offices.find(
    (office) =>
      office.city.toLowerCase() === normalized ||
      office.id === normalized ||
      // compatibilidad con el nombre antiguo de la sede de Soria
      (normalized === 'soria' && office.id === 'agreda'),
  );
  return match?.id ?? offices[0].id;
}

/** Datos de contacto generales de la empresa. */
export const company = {
  name: 'Alcocars',
  legalName: 'Alcotrans, S.L.',
  email: 'info@alcocars.es',
  phone: '976 106 100',
  whatsapp: '+34 608 808 240',
  regions: ['Zaragoza', 'Ágreda (Soria)', 'Ribera Navarra', 'La Rioja'],
} as const;
