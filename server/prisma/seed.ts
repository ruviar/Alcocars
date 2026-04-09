import 'dotenv/config';
import { PrismaClient, CategoryGroup } from '@prisma/client';
import bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL?.trim();

function printSeedHelp(error: unknown): void {
  if (!(error instanceof Error)) {
    return;
  }

  const message = error.message;

  if (message.includes('Environment variable not found: DATABASE_URL')) {
    console.error('');
    console.error('❌ Missing DATABASE_URL.');
    console.error('   Create server/.env and set DATABASE_URL with your real Postgres credentials.');
    console.error('   Example: postgresql://postgres:<your-password>@localhost:5432/alocars');
    return;
  }

  if (message.includes('Authentication failed against database server')) {
    console.error('');
    console.error('❌ Database authentication failed.');
    console.error('   Update DATABASE_URL in server/.env with valid user/password for your Postgres instance.');

    if (databaseUrl?.includes('://postgres:password@')) {
      console.error('   You are still using the placeholder password from .env.example.');
    }

    console.error('   Then rerun: npm run db:seed');
    return;
  }

  if (message.toLowerCase().includes('does not exist')) {
    console.error('');
    console.error('❌ Target database does not exist.');
    console.error('   Create it first, for example: createdb alocars');
  }
}

const prisma = new PrismaClient();

// ── Offices ──────────────────────────────────────────────────────────────────

const officesData = [
  {
    slug: 'zaragoza',
    city: 'Zaragoza',
    address: 'Av. de Goya, 12, 50006 Zaragoza',
    phone: '+34 976 123 456',
    email: 'zaragoza@alocars.es',
    hours: 'Lun–Vie 08:00–20:00 · Sáb 09:00–14:00',
    lat: 41.6488,
    lng: -0.8891,
    description: 'Sede central. Acceso rápido al aeropuerto de Zaragoza y conexión directa con la A-2.',
  },
  {
    slug: 'tudela',
    city: 'Tudela',
    address: 'Calle Gayarre, 4, 31500 Tudela (Navarra)',
    phone: '+34 948 234 567',
    email: 'tudela@alocars.es',
    hours: 'Lun–Vie 08:30–19:00 · Sáb 09:00–13:00',
    lat: 42.0606,
    lng: -1.6054,
    description: 'Puerta de entrada a la Ribera Navarra. Perfecta para explorar la región a tu ritmo.',
  },
  {
    slug: 'soria',
    city: 'Soria',
    address: 'Alcotrans | Transporte de áridos, N-122, 105, 42100 Ágreda, Soria',
    phone: '+34 975 345 678',
    email: 'soria@alocars.es',
    hours: 'Lun–Vie 09:00–18:30',
    lat: 41.7672,
    lng: -2.4799,
    description: 'En el corazón de Castilla. Base ideal para la Sierra de Urbión y las tierras de Machado.',
  },
];

// ── Categories ────────────────────────────────────────────────────────────────

type CategoryInput = {
  slug: string;
  name: string;
  group: CategoryGroup;
  order: number;
  price1Day: number;
  price2Day: number;
  price3Day: number;
  price4Day: number;
  price5Day: number;
  price6Day: number;
  price7Day: number;
  extraKmRate: number;
  deposit: number;
  franchise: number;
  powerMin: number; // TODO: confirm with client
  powerMax: number; // TODO: confirm with client
  seatsMin: number; // TODO: confirm with client
  seatsMax: number; // TODO: confirm with client
  transmissions: string[]; // TODO: confirm with client
  fuels: string[]; // TODO: confirm with client
  highlight: string;
  imageUrl: null;
  description: null;
  isActive: boolean;
};

const categoriesData: CategoryInput[] = [
  {
    slug: 'coche-gama-basica',
    name: 'Coche Gama básica',
    group: 'COCHE',
    order: 1,
    price1Day: 61,
    price2Day: 118,
    price3Day: 154,
    price4Day: 180,
    price5Day: 205,
    price6Day: 224,
    price7Day: 255,
    extraKmRate: 0.15,
    deposit: 300,
    franchise: 300,
    powerMin: 75, // TODO: confirm with client
    powerMax: 110, // TODO: confirm with client
    seatsMin: 5, // TODO: confirm with client
    seatsMax: 5, // TODO: confirm with client
    transmissions: ['MANUAL', 'AUTOMATICO'], // TODO: confirm with client
    fuels: ['GASOLINA', 'DIESEL'], // TODO: confirm with client
    highlight: 'Turismo de gama básica, ideal para ciudad y desplazamientos cortos',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'coche-gama-media',
    name: 'Coche Gama media',
    group: 'COCHE',
    order: 2,
    price1Day: 81,
    price2Day: 154,
    price3Day: 205,
    price4Day: 241,
    price5Day: 275,
    price6Day: 296,
    price7Day: 337,
    extraKmRate: 0.20,
    deposit: 300,
    franchise: 300,
    powerMin: 110, // TODO: confirm with client
    powerMax: 150, // TODO: confirm with client
    seatsMin: 5, // TODO: confirm with client
    seatsMax: 5, // TODO: confirm with client
    transmissions: ['MANUAL', 'AUTOMATICO'], // TODO: confirm with client
    fuels: ['GASOLINA', 'DIESEL', 'HIBRIDO'], // TODO: confirm with client
    highlight: 'Turismo de gama media, confort y eficiencia para viajes de negocios y ocio',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'coche-gama-alta',
    name: 'Coche Gama alta',
    group: 'COCHE',
    order: 3,
    price1Day: 102,
    price2Day: 198,
    price3Day: 273,
    price4Day: 323,
    price5Day: 374,
    price6Day: 403,
    price7Day: 465,
    extraKmRate: 0.25,
    deposit: 300,
    franchise: 300,
    powerMin: 150, // TODO: confirm with client
    powerMax: 250, // TODO: confirm with client
    seatsMin: 5, // TODO: confirm with client
    seatsMax: 5, // TODO: confirm with client
    transmissions: ['AUTOMATICO'], // TODO: confirm with client
    fuels: ['GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO'], // TODO: confirm with client
    highlight: 'Turismo de gama alta, prestaciones premium y tecnología de última generación',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'furgo-transporte-5',
    name: 'Furgoneta transporte 5 pax',
    group: 'FURGONETA_TRANSPORTE',
    order: 4,
    price1Day: 81,
    price2Day: 157,
    price3Day: 224,
    price4Day: 287,
    price5Day: 332,
    price6Day: 394,
    price7Day: 421,
    extraKmRate: 0.17,
    deposit: 300,
    franchise: 300,
    powerMin: 100, // TODO: confirm with client
    powerMax: 130, // TODO: confirm with client
    seatsMin: 5, // TODO: confirm with client
    seatsMax: 5, // TODO: confirm with client
    transmissions: ['MANUAL', 'AUTOMATICO'], // TODO: confirm with client
    fuels: ['DIESEL'], // TODO: confirm with client
    highlight: 'Furgoneta de transporte para 5 pasajeros, amplio espacio y comodidad',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'furgo-transporte-6',
    name: 'Furgoneta transporte 6 pax',
    group: 'FURGONETA_TRANSPORTE',
    order: 5,
    price1Day: 125,
    price2Day: 227,
    price3Day: 318,
    price4Day: 404,
    price5Day: 453,
    price6Day: 510,
    price7Day: 590,
    extraKmRate: 0.22,
    deposit: 300,
    franchise: 300,
    powerMin: 130, // TODO: confirm with client
    powerMax: 165, // TODO: confirm with client
    seatsMin: 6, // TODO: confirm with client
    seatsMax: 6, // TODO: confirm with client
    transmissions: ['MANUAL', 'AUTOMATICO'], // TODO: confirm with client
    fuels: ['DIESEL'], // TODO: confirm with client
    highlight: 'Furgoneta de transporte para 6 pasajeros, perfecta para grupos y traslados',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'furgo-transporte-9',
    name: 'Furgoneta transporte 9 pax',
    group: 'FURGONETA_TRANSPORTE',
    order: 6,
    price1Day: 171,
    price2Day: 295,
    price3Day: 402,
    price4Day: 482,
    price5Day: 535,
    price6Day: 602,
    price7Day: 680,
    extraKmRate: 0.27,
    deposit: 600,
    franchise: 600,
    powerMin: 140, // TODO: confirm with client
    powerMax: 180, // TODO: confirm with client
    seatsMin: 9, // TODO: confirm with client
    seatsMax: 9, // TODO: confirm with client
    transmissions: ['MANUAL'], // TODO: confirm with client
    fuels: ['DIESEL'], // TODO: confirm with client
    highlight: 'Furgoneta de transporte para 9 pasajeros, ideal para excursiones y grupos grandes',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'furgo-carga-2',
    name: 'Furgoneta carga 2 pax',
    group: 'FURGONETA_CARGA',
    order: 7,
    price1Day: 73,
    price2Day: 143,
    price3Day: 205,
    price4Day: 255,
    price5Day: 306,
    price6Day: 362,
    price7Day: 408,
    extraKmRate: 0.17,
    deposit: 300,
    franchise: 300,
    powerMin: 90, // TODO: confirm with client
    powerMax: 130, // TODO: confirm with client
    seatsMin: 2, // TODO: confirm with client
    seatsMax: 2, // TODO: confirm with client
    transmissions: ['MANUAL'], // TODO: confirm with client
    fuels: ['DIESEL'], // TODO: confirm with client
    highlight: 'Furgoneta de carga pequeña para 2 personas, ágil y económica para repartos',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'furgo-carga-3',
    name: 'Furgoneta carga 3 pax',
    group: 'FURGONETA_CARGA',
    order: 8,
    price1Day: 113,
    price2Day: 201,
    price3Day: 284,
    price4Day: 352,
    price5Day: 402,
    price6Day: 453,
    price7Day: 521,
    extraKmRate: 0.22,
    deposit: 300,
    franchise: 300,
    powerMin: 100, // TODO: confirm with client
    powerMax: 140, // TODO: confirm with client
    seatsMin: 3, // TODO: confirm with client
    seatsMax: 3, // TODO: confirm with client
    transmissions: ['MANUAL'], // TODO: confirm with client
    fuels: ['DIESEL'], // TODO: confirm with client
    highlight: 'Furgoneta de carga mediana para 3 personas, versátil para mudanzas y transporte',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'furgo-carga-12m3',
    name: 'Furgoneta carga 12m3 3 pax',
    group: 'FURGONETA_CARGA',
    order: 9,
    price1Day: 136,
    price2Day: 244,
    price3Day: 340,
    price4Day: 426,
    price5Day: 499,
    price6Day: 556,
    price7Day: 635,
    extraKmRate: 0.25,
    deposit: 300,
    franchise: 300,
    powerMin: 110, // TODO: confirm with client
    powerMax: 150, // TODO: confirm with client
    seatsMin: 3, // TODO: confirm with client
    seatsMax: 3, // TODO: confirm with client
    transmissions: ['MANUAL'], // TODO: confirm with client
    fuels: ['DIESEL'], // TODO: confirm with client
    highlight: 'Furgoneta de gran volumen 12m³ para 3 personas, perfecta para mudanzas completas',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'furgo-carga-caja-abierta',
    name: 'Furgoneta carga Caja abierta',
    group: 'FURGONETA_CARGA',
    order: 10,
    price1Day: 138,
    price2Day: 275,
    price3Day: 413,
    price4Day: 515,
    price5Day: 644,
    price6Day: 772,
    price7Day: 855,
    extraKmRate: 0.25,
    deposit: 600,
    franchise: 600,
    powerMin: 130, // TODO: confirm with client
    powerMax: 180, // TODO: confirm with client
    seatsMin: 3, // TODO: confirm with client
    seatsMax: 3, // TODO: confirm with client
    transmissions: ['MANUAL'], // TODO: confirm with client
    fuels: ['DIESEL'], // TODO: confirm with client
    highlight: 'Furgoneta de caja abierta para trabajos de construcción y transporte de materiales',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'todoterreno-corto',
    name: 'Todoterreno Corto',
    group: 'TODOTERRENO',
    order: 11,
    price1Day: 171,
    price2Day: 295,
    price3Day: 402,
    price4Day: 482,
    price5Day: 535,
    price6Day: 602,
    price7Day: 680,
    extraKmRate: 0.27,
    deposit: 600,
    franchise: 600,
    powerMin: 150, // TODO: confirm with client
    powerMax: 200, // TODO: confirm with client
    seatsMin: 5, // TODO: confirm with client
    seatsMax: 7, // TODO: confirm with client
    transmissions: ['AUTOMATICO'], // TODO: confirm with client
    fuels: ['DIESEL', 'GASOLINA'], // TODO: confirm with client
    highlight: 'Todoterreno compacto 4x4, ideal para rutas de montaña y terrenos difíciles',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'todoterreno-largo',
    name: 'Todoterreno Largo',
    group: 'TODOTERRENO',
    order: 12,
    price1Day: 205,
    price2Day: 340,
    price3Day: 468,
    price4Day: 590,
    price5Day: 766,
    price6Day: 808,
    price7Day: 850,
    extraKmRate: 0.27,
    deposit: 600,
    franchise: 600,
    powerMin: 190, // TODO: confirm with client
    powerMax: 250, // TODO: confirm with client
    seatsMin: 5, // TODO: confirm with client
    seatsMax: 7, // TODO: confirm with client
    transmissions: ['AUTOMATICO'], // TODO: confirm with client
    fuels: ['DIESEL', 'GASOLINA'], // TODO: confirm with client
    highlight: 'Todoterreno de largo recorrido, máxima capacidad y confort para expediciones',
    imageUrl: null,
    description: null,
    isActive: true,
  },
  {
    slug: 'todoterreno-pickup',
    name: 'Todoterreno Pick-up',
    group: 'TODOTERRENO',
    order: 13,
    price1Day: 205,
    price2Day: 340,
    price3Day: 468,
    price4Day: 590,
    price5Day: 766,
    price6Day: 808,
    price7Day: 850,
    extraKmRate: 0.27,
    deposit: 600,
    franchise: 600,
    powerMin: 190, // TODO: confirm with client
    powerMax: 250, // TODO: confirm with client
    seatsMin: 2, // TODO: confirm with client
    seatsMax: 5, // TODO: confirm with client
    transmissions: ['MANUAL', 'AUTOMATICO'], // TODO: confirm with client
    fuels: ['DIESEL'], // TODO: confirm with client
    highlight: 'Pick-up todoterreno 4x4, combina capacidad de carga con tracción total para todo tipo de terreno',
    imageUrl: null,
    description: null,
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  if (!databaseUrl) {
    throw new Error('Environment variable not found: DATABASE_URL');
  }

  await prisma.$connect();

  // Upsert offices
  for (const office of officesData) {
    await prisma.office.upsert({
      where: { slug: office.slug },
      update: office,
      create: office,
    });
  }
  console.log(`✅ ${officesData.length} offices seeded`);

  // Upsert categories
  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`✅ ${categoriesData.length} categories seeded`);

  // Upsert default admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@alocars.es' },
    update: { name: 'Administrador', passwordHash },
    create: { email: 'admin@alocars.es', passwordHash, name: 'Administrador' },
  });
  console.log('✅ Admin user seeded');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    printSeedHelp(e);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
