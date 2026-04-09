export interface TariffEntry {
  id: string;
  name: string;
  superCategory: 'Coches' | 'Furgonetas' | 'Todoterrenos' | 'Autocaravanas';
  /** true → no fixed price, contact for quote */
  consultOnly?: boolean;
  /** prices for 1–7 days (index 0 = 1 day, index 6 = 7 days) */
  rates: number[];
  /** extra km cost in €/km */
  kmExtra: number;
  /** security deposit in € */
  deposit: number;
  /** franchise (excess) in € */
  franchise: number;
  /** included km per day */
  kmPerDay: number;
}

export const SUPER_CATEGORIES = ['Coches', 'Furgonetas', 'Todoterrenos', 'Autocaravanas'] as const;
export type SuperCategory = (typeof SUPER_CATEGORIES)[number];

export const tariffs: TariffEntry[] = [
  // ── COCHES ──────────────────────────────────────────────────────
  {
    id: 'coche-basica',
    name: 'Coche Gama Básica',
    superCategory: 'Coches',
    rates: [61, 118, 154, 180, 205, 224, 255],
    kmExtra: 0.15,
    deposit: 300,
    franchise: 300,
    kmPerDay: 200,
  },
  {
    id: 'coche-media',
    name: 'Coche Gama Media',
    superCategory: 'Coches',
    rates: [81, 154, 205, 241, 275, 296, 337],
    kmExtra: 0.20,
    deposit: 300,
    franchise: 300,
    kmPerDay: 200,
  },
  {
    id: 'coche-alta',
    name: 'Coche Gama Alta',
    superCategory: 'Coches',
    rates: [102, 198, 273, 323, 374, 403, 465],
    kmExtra: 0.25,
    deposit: 300,
    franchise: 300,
    kmPerDay: 200,
  },

  // ── FURGONETAS ──────────────────────────────────────────────────
  {
    id: 'furg-transp-5p',
    name: 'Furgoneta Transporte 5 Pasajeros',
    superCategory: 'Furgonetas',
    rates: [81, 157, 224, 287, 332, 394, 421],
    kmExtra: 0.17,
    deposit: 300,
    franchise: 300,
    kmPerDay: 200,
  },
  {
    id: 'furg-transp-6p',
    name: 'Furgoneta Transporte 6 Pasajeros',
    superCategory: 'Furgonetas',
    rates: [125, 227, 318, 404, 453, 510, 590],
    kmExtra: 0.22,
    deposit: 300,
    franchise: 300,
    kmPerDay: 200,
  },
  {
    id: 'furg-transp-9p',
    name: 'Furgoneta Transporte 9 Pasajeros',
    superCategory: 'Furgonetas',
    rates: [171, 295, 402, 482, 535, 602, 680],
    kmExtra: 0.27,
    deposit: 600,
    franchise: 600,
    kmPerDay: 200,
  },
  {
    id: 'furg-carga-2p',
    name: 'Furgoneta Carga 2 Pasajeros',
    superCategory: 'Furgonetas',
    rates: [73, 143, 205, 255, 306, 362, 408],
    kmExtra: 0.17,
    deposit: 300,
    franchise: 300,
    kmPerDay: 200,
  },
  {
    id: 'furg-carga-3p',
    name: 'Furgoneta Carga 3 Pasajeros',
    superCategory: 'Furgonetas',
    rates: [113, 201, 284, 352, 402, 453, 521],
    kmExtra: 0.22,
    deposit: 300,
    franchise: 300,
    kmPerDay: 200,
  },
  {
    id: 'furg-carga-12m3',
    name: 'Furgoneta Carga 12m³ y 3 Pasajeros',
    superCategory: 'Furgonetas',
    rates: [136, 244, 340, 426, 499, 556, 635],
    kmExtra: 0.25,
    deposit: 300,
    franchise: 300,
    kmPerDay: 200,
  },
  {
    id: 'furg-caja-abierta',
    name: 'Furgoneta Carga Caja Abierta',
    superCategory: 'Furgonetas',
    rates: [138, 275, 413, 515, 644, 772, 855],
    kmExtra: 0.25,
    deposit: 600,
    franchise: 600,
    kmPerDay: 200,
  },

  // ── TODOTERRENOS ────────────────────────────────────────────────
  {
    id: 'tt-corto',
    name: 'Todoterreno Corto',
    superCategory: 'Todoterrenos',
    rates: [171, 295, 402, 482, 535, 602, 680],
    kmExtra: 0.27,
    deposit: 600,
    franchise: 600,
    kmPerDay: 200,
  },
  {
    id: 'tt-largo',
    name: 'Todoterreno Largo',
    superCategory: 'Todoterrenos',
    rates: [205, 340, 468, 590, 766, 808, 850],
    kmExtra: 0.27,
    deposit: 600,
    franchise: 600,
    kmPerDay: 200,
  },
  {
    id: 'tt-pickup',
    name: 'Todoterreno Pick-Up',
    superCategory: 'Todoterrenos',
    rates: [205, 340, 468, 590, 766, 808, 850],
    kmExtra: 0.27,
    deposit: 600,
    franchise: 600,
    kmPerDay: 200,
  },

  // ── AUTOCARAVANAS ───────────────────────────────────────────────
  {
    id: 'autocaravana',
    name: 'Autocaravana',
    superCategory: 'Autocaravanas',
    consultOnly: true,
    rates: [],
    kmExtra: 0,
    deposit: 0,
    franchise: 0,
    kmPerDay: 200,
  },
];
