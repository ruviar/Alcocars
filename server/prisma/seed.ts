import 'dotenv/config';
import { PrismaClient, VehicleCategory, FuelType, TransmissionType } from '@prisma/client';
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
    address: 'Paseo del Espolón, 20, 42001 Soria',
    phone: '+34 975 345 678',
    email: 'soria@alocars.es',
    hours: 'Lun–Vie 09:00–18:30',
    lat: 41.7672,
    lng: -2.4799,
    description: 'En el corazón de Castilla. Base ideal para la Sierra de Urbión y las tierras de Machado.',
  },
];

type VehicleInput = {
  slug: string;
  name: string;
  brand: string;
  category: VehicleCategory;
  seats: number;
  power: string;
  fuel: FuelType;
  transmission: TransmissionType;
  dailyRate: number;
  imageUrl: string;
  highlight: string;
  officeSlug: string;
};

const vehiclesData: VehicleInput[] = [
  // ── ZARAGOZA (9 vehicles) ──────────────────────────────────────
  {
    slug: 'tesla-model-s',
    name: 'Model S',
    brand: 'Tesla',
    category: 'TURISMOS',
    seats: 5,
    power: '670 CV',
    fuel: 'ELECTRICO',
    transmission: 'AUTOMATICO',
    dailyRate: 89,
    imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=900&q=80',
    highlight: 'Autonomía 660 km',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'audi-a6',
    name: 'A6',
    brand: 'Audi',
    category: 'TURISMOS',
    seats: 5,
    power: '249 CV',
    fuel: 'HIBRIDO',
    transmission: 'AUTOMATICO',
    dailyRate: 72,
    imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=80',
    highlight: 'Business Premium',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'mercedes-clase-e',
    name: 'Clase E',
    brand: 'Mercedes-Benz',
    category: 'TURISMOS',
    seats: 5,
    power: '258 CV',
    fuel: 'DIESEL',
    transmission: 'AUTOMATICO',
    dailyRate: 78,
    imageUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=900&q=80',
    highlight: 'Confort ejecutivo',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'mercedes-eclass-coupe',
    name: 'E-Class Coupé',
    brand: 'Mercedes-Benz',
    category: 'TURISMOS',
    seats: 4,
    power: '299 CV',
    fuel: 'GASOLINA',
    transmission: 'AUTOMATICO',
    dailyRate: 92,
    imageUrl: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=900&q=80',
    highlight: 'Estilo sin concesiones',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'tesla-model-3',
    name: 'Model 3',
    brand: 'Tesla',
    category: 'TURISMOS',
    seats: 5,
    power: '351 CV',
    fuel: 'ELECTRICO',
    transmission: 'AUTOMATICO',
    dailyRate: 65,
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900&q=80',
    highlight: 'El más popular',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'ford-transit-custom',
    name: 'Transit Custom',
    brand: 'Ford',
    category: 'FURGONETAS',
    seats: 3,
    power: '185 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 65,
    imageUrl: 'https://images.unsplash.com/photo-1611186871525-6635f6234dff?w=900&q=80',
    highlight: '6.8 m³ de carga',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'vw-crafter',
    name: 'Crafter',
    brand: 'Volkswagen',
    category: 'FURGONETAS',
    seats: 2,
    power: '140 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 58,
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&q=80',
    highlight: 'Jumbo 11 m³',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'land-rover-defender',
    name: 'Defender 110',
    brand: 'Land Rover',
    category: 'SUV_4X4',
    seats: 7,
    power: '400 CV',
    fuel: 'DIESEL',
    transmission: 'AUTOMATICO',
    dailyRate: 120,
    imageUrl: 'https://images.unsplash.com/photo-1623972374773-52badc5f4bdc?w=900&q=80',
    highlight: 'Terreno extremo',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'mercedes-g-klasse',
    name: 'G-Klasse',
    brand: 'Mercedes-Benz',
    category: 'SUV_4X4',
    seats: 5,
    power: '585 CV',
    fuel: 'GASOLINA',
    transmission: 'AUTOMATICO',
    dailyRate: 195,
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=900&q=80',
    highlight: 'Icono absoluto',
    officeSlug: 'zaragoza',
  },
  // ── TUDELA (6 vehicles) ────────────────────────────────────────
  {
    slug: 'toyota-hilux',
    name: 'Hilux',
    brand: 'Toyota',
    category: 'SUV_4X4',
    seats: 5,
    power: '204 CV',
    fuel: 'DIESEL',
    transmission: 'AUTOMATICO',
    dailyRate: 95,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
    highlight: 'Pick-up indestructible',
    officeSlug: 'tudela',
  },
  {
    slug: 'vw-california-beach',
    name: 'California Beach',
    brand: 'Volkswagen',
    category: 'AUTOCARAVANAS',
    seats: 4,
    power: '150 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 145,
    imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=900&q=80',
    highlight: 'Van lifestyle',
    officeSlug: 'tudela',
  },
  {
    slug: 'seat-arona',
    name: 'Arona',
    brand: 'Seat',
    category: 'TURISMOS',
    seats: 5,
    power: '110 CV',
    fuel: 'GASOLINA',
    transmission: 'MANUAL',
    dailyRate: 42,
    imageUrl: 'https://images.unsplash.com/photo-1583267746897-2cf415887172?w=900&q=80',
    highlight: 'Urban crossover',
    officeSlug: 'tudela',
  },
  {
    slug: 'skoda-octavia',
    name: 'Octavia',
    brand: 'Škoda',
    category: 'TURISMOS',
    seats: 5,
    power: '150 CV',
    fuel: 'DIESEL',
    transmission: 'AUTOMATICO',
    dailyRate: 55,
    imageUrl: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=900&q=80',
    highlight: 'La berlina inteligente',
    officeSlug: 'tudela',
  },
  {
    slug: 'renault-trafic',
    name: 'Trafic',
    brand: 'Renault',
    category: 'FURGONETAS',
    seats: 3,
    power: '120 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 52,
    imageUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=900&q=80',
    highlight: '5.2 m³ de carga',
    officeSlug: 'tudela',
  },
  {
    slug: 'citroen-berlingo',
    name: 'Berlingo',
    brand: 'Citroën',
    category: 'FURGONETAS',
    seats: 2,
    power: '100 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 44,
    imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=900&q=80',
    highlight: 'Reparto urbano',
    officeSlug: 'tudela',
  },
  // ── SORIA (5 vehicles) ─────────────────────────────────────────
  {
    slug: 'hymer-globetrotter',
    name: 'Globetrotter',
    brand: 'Hymer',
    category: 'AUTOCARAVANAS',
    seats: 4,
    power: '177 CV',
    fuel: 'DIESEL',
    transmission: 'AUTOMATICO',
    dailyRate: 180,
    imageUrl: 'https://images.unsplash.com/photo-1558981852-426c070e83e5?w=900&q=80',
    highlight: 'Cocina + ducha + cama',
    officeSlug: 'soria',
  },
  {
    slug: 'seat-ibiza',
    name: 'Ibiza',
    brand: 'Seat',
    category: 'TURISMOS',
    seats: 5,
    power: '95 CV',
    fuel: 'GASOLINA',
    transmission: 'MANUAL',
    dailyRate: 35,
    imageUrl: 'https://images.unsplash.com/photo-1471479917193-f00955256257?w=900&q=80',
    highlight: 'Compacto y dinámico',
    officeSlug: 'soria',
  },
  {
    slug: 'ford-fiesta',
    name: 'Fiesta',
    brand: 'Ford',
    category: 'TURISMOS',
    seats: 5,
    power: '100 CV',
    fuel: 'GASOLINA',
    transmission: 'MANUAL',
    dailyRate: 32,
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&q=80',
    highlight: 'El más vendido',
    officeSlug: 'soria',
  },
  {
    slug: 'fiat-ducato',
    name: 'Ducato',
    brand: 'Fiat',
    category: 'FURGONETAS',
    seats: 3,
    power: '160 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 62,
    imageUrl: 'https://images.unsplash.com/photo-1566843972142-a7fcb70de55b?w=900&q=80',
    highlight: '13 m³ maxi',
    officeSlug: 'soria',
  },
  {
    slug: 'kia-sportage',
    name: 'Sportage',
    brand: 'Kia',
    category: 'SUV_4X4',
    seats: 5,
    power: '136 CV',
    fuel: 'HIBRIDO',
    transmission: 'AUTOMATICO',
    dailyRate: 68,
    imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=900&q=80',
    highlight: 'SUV híbrido familiar',
    officeSlug: 'soria',
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

  // Upsert vehicles
  for (const v of vehiclesData) {
    const { officeSlug, ...vehicleFields } = v;
    const office = await prisma.office.findUniqueOrThrow({ where: { slug: officeSlug } });
    await prisma.vehicle.upsert({
      where: { slug: vehicleFields.slug },
      update: { ...vehicleFields, officeId: office.id },
      create: { ...vehicleFields, officeId: office.id },
    });
  }
  console.log(`✅ ${vehiclesData.length} vehicles seeded`);

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
