/**
 * Datos reales de la empresa. Se usan en los emails y los expone la API para
 * que el frontend no tenga que duplicarlos.
 *
 * PENDIENTE DE CONFIRMAR con el cliente (marcado con `verified: false`):
 *   · Teléfono directo de la oficina de Tudela (se usa el central de Zaragoza).
 *   · Coordenadas exactas de cada oficina: las de abajo son aproximadas a partir
 *     de la dirección postal. El enlace «Ver en Google Maps» se construye con la
 *     dirección, así que siempre lleva al sitio correcto aunque el pin baile.
 *   · Razón social, CIF y domicilio fiscal para el aviso legal (obligatorio por
 *     LSSI-CE). El grupo opera como Alcotrans, S.L.
 */

export interface CompanyOffice {
  slug: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  phoneVerified: boolean;
  email: string;
  hours: string;
  /** [lat, lng] aproximadas */
  coords: [number, number];
  coordsVerified: boolean;
  description: string;
}

export const COMPANY = {
  name: 'Alcocars',
  legalName: 'Alcotrans, S.L.',
  /** TODO cliente: CIF y domicilio social para el aviso legal */
  taxId: null as string | null,
  email: 'info@alcocars.es',
  /** Central: la oficina de Zaragoza */
  phone: '976 106 100',
  whatsapp: '+34 608 808 240',
  website: 'https://alcocars.es',
  regions: ['Zaragoza', 'Ágreda (Soria)', 'Ribera Navarra', 'La Rioja'],
} as const;

export const OFFICES: CompanyOffice[] = [
  {
    slug: 'zaragoza',
    city: 'Zaragoza',
    region: 'Aragón',
    address: 'Ctra. de Logroño, km 6,4 — local 1, Polígono El Portazgo (frente a Pikolin), 50011 Zaragoza',
    phone: '976 106 100',
    phoneVerified: true,
    email: 'zaragoza@alcocars.es',
    hours: 'Lun–Vie 9:00–13:00 y 16:00–19:00 · Sáb 9:00–12:30',
    coords: [41.6835, -0.9339],
    coordsVerified: false,
    description:
      'Nuestra oficina principal, a pie de la N-232 y con salida directa a la A-68 y la Z-40. Es la base desde la que damos servicio al aeropuerto de Zaragoza.',
  },
  {
    slug: 'agreda',
    city: 'Ágreda',
    region: 'Soria',
    address: 'Ctra. N-122, km 105, 42100 Ágreda (Soria)',
    phone: '976 646 868',
    phoneVerified: true,
    email: 'agreda@alcocars.es',
    hours: 'Lun–Vie 9:00–13:00 y 16:00–19:00 · Sáb 9:00–12:30',
    coords: [41.8464, -1.9686],
    coordsVerified: false,
    description:
      'En el kilómetro 105 de la N-122, junto a las instalaciones de Alcotrans. El punto natural para moverse entre Soria, el Moncayo y la Ribera.',
  },
  {
    slug: 'tudela',
    city: 'Tudela',
    region: 'Navarra',
    address: 'Av. de Zaragoza, 46, 31500 Tudela (Navarra)',
    phone: '976 106 100',
    phoneVerified: false,
    email: 'tudela@alcocars.es',
    hours: 'Lun–Vie 9:00–13:00 y 16:00–19:00 · Sáb 9:00–12:30',
    coords: [42.0602, -1.604],
    coordsVerified: false,
    description:
      'Nuestra puerta de entrada a la Ribera Navarra y La Rioja, en plena Avenida de Zaragoza y a cinco minutos de la AP-15.',
  },
];

export function getOffice(slug: string): CompanyOffice | null {
  return OFFICES.find((office) => office.slug === slug) ?? null;
}

/** Enlace de búsqueda en Google Maps a partir de la dirección postal. */
export function mapsLink(office: CompanyOffice): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${COMPANY.name} ${office.address}`,
  )}`;
}
