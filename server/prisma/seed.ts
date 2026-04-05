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
  // ── ZARAGOZA (Sede principal) ──────────────────────────────────
  {
    slug: 'seat-ibiza-eco',
    name: 'Ibiza',
    brand: 'Seat',
    category: 'TURISMOS',
    seats: 5,
    power: '80 CV',
    fuel: 'GASOLINA',
    transmission: 'MANUAL',
    dailyRate: 33,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/2018_SEAT_Ibiza_SE_Technology_MPi_1.0_Front.jpg/960px-2018_SEAT_Ibiza_SE_Technology_MPi_1.0_Front.jpg',
    highlight: 'Económico y ciudad',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'seat-leon-tdi',
    name: 'León',
    brand: 'Seat',
    category: 'TURISMOS',
    seats: 5,
    power: '115 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 45,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/2020_SEAT_Leon_FR_TSi_Evo_1.5_Front.jpg/960px-2020_SEAT_Leon_FR_TSi_Evo_1.5_Front.jpg',
    highlight: 'Gama Media - 5 puertas',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'ford-custom-6p',
    name: 'Custom (6 Plazas)',
    brand: 'Ford',
    category: 'FURGONETAS',
    seats: 6,
    power: '130 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 84,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/2024_Ford_Transit_Custom_Limited_TDCi_-_1996cc_2.0_%28136PS%29_Diesel_-_Artisan_Red_-_08-2024%2C_Front.jpg/960px-2024_Ford_Transit_Custom_Limited_TDCi_-_1996cc_2.0_%28136PS%29_Diesel_-_Artisan_Red_-_08-2024%2C_Front.jpg',
    highlight: 'Furgoneta pasajeros 6 pax',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'furgoneta-carga-3m3',
    name: 'Berlingo / Partner',
    brand: 'Citroën/Peugeot',
    category: 'FURGONETAS',
    seats: 2,
    power: '100 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 58,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Citro%C3%ABn_Berlingo_XL_BlueHDi_130_EAT8_Shine_XTR_%28III%29_%E2%80%93_f_02012021.jpg/960px-Citro%C3%ABn_Berlingo_XL_BlueHDi_130_EAT8_Shine_XTR_%28III%29_%E2%80%93_f_02012021.jpg',
    highlight: 'Carga 3m³ (2 pasajeros)',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'furgoneta-carga-12m3',
    name: 'Boxer / Ducato',
    brand: 'Peugeot/Fiat',
    category: 'FURGONETAS',
    seats: 3,
    power: '140 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 91,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Fiat_e-Ducato_1X7A0350.jpg/960px-Fiat_e-Ducato_1X7A0350.jpg',
    highlight: 'Carga Gran Volumen 12m³',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'toyota-hilux-pickup',
    name: 'Hilux Pick-Up 4x4',
    brand: 'Toyota',
    category: 'SUV_4X4',
    seats: 5,
    power: '150 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 95,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/2016_Toyota_HiLux_Invincible_D-4D_4WD_2.4_Front.jpg/960px-2016_Toyota_HiLux_Invincible_D-4D_4WD_2.4_Front.jpg',
    highlight: 'Pick-up trabajo / Todoterreno',
    officeSlug: 'zaragoza',
  },
  {
    slug: 'vw-passat-business',
    name: 'Passat / Superb',
    brand: 'Volkswagen/Skoda',
    category: 'TURISMOS',
    seats: 5,
    power: '150 CV',
    fuel: 'DIESEL',
    transmission: 'AUTOMATICO',
    dailyRate: 65,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/VW_Passat_Variant_Elegance_%28B9%29_%E2%80%93_f_18052025.jpg/960px-VW_Passat_Variant_Elegance_%28B9%29_%E2%80%93_f_18052025.jpg',
    highlight: 'Gama Alta - Representación',
    officeSlug: 'zaragoza',
  },
  // ── TUDELA (Enfoque en transporte y furgonetas medias) ─────────
  {
    slug: 'renault-clio-tudela',
    name: 'Clio',
    brand: 'Renault',
    category: 'TURISMOS',
    seats: 5,
    power: '90 CV',
    fuel: 'GASOLINA',
    transmission: 'MANUAL',
    dailyRate: 35,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Renault_Clio_%28V%2C_Facelift%29_%E2%80%93_f_02092025.jpg/960px-Renault_Clio_%28V%2C_Facelift%29_%E2%80%93_f_02092025.jpg',
    highlight: 'Turismo compacto',
    officeSlug: 'tudela',
  },
  {
    slug: 'furgoneta-pasajeros-9p',
    name: 'Tourneo / Vito (9 Plazas)',
    brand: 'Ford/Mercedes',
    category: 'FURGONETAS',
    seats: 9,
    power: '130 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 97,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Mercedes-Benz_V_250_d_Exclusive_AMG_Line_Lang_%28V_447%29_%E2%80%93_Frontansicht%2C_29._Juni_2016%2C_D%C3%BCsseldorf.jpg/960px-Mercedes-Benz_V_250_d_Exclusive_AMG_Line_Lang_%28V_447%29_%E2%80%93_Frontansicht%2C_29._Juni_2016%2C_D%C3%BCsseldorf.jpg',
    highlight: 'Furgoneta transporte 9 pax',
    officeSlug: 'tudela',
  },
  {
    slug: 'furgoneta-carga-7m3',
    name: 'Trafic / Custom',
    brand: 'Renault/Ford',
    category: 'FURGONETAS',
    seats: 3,
    power: '120 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 74,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/2024_Renault_Trafic_LWB_Premium_front.jpg/960px-2024_Renault_Trafic_LWB_Premium_front.jpg',
    highlight: 'Carga media 6-8m³',
    officeSlug: 'tudela',
  },
  {
    slug: 'autocaravana-tudela',
    name: 'Autocaravana Perfilada',
    brand: 'Benimar',
    category: 'AUTOCARAVANAS',
    seats: 4,
    power: '140 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 145,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Hymer-Motorhome.JPG',
    highlight: 'Renting vacacional',
    officeSlug: 'tudela',
  },
  // ── SORIA (Utilitarios, 4x4 y furgoneta caja abierta) ──────────
  {
    slug: 'dacia-sandero-soria',
    name: 'Sandero',
    brand: 'Dacia',
    category: 'TURISMOS',
    seats: 5,
    power: '90 CV',
    fuel: 'GASOLINA',
    transmission: 'MANUAL',
    dailyRate: 33,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/2023_Dacia_Sandero_III_DSC_6012.jpg/960px-2023_Dacia_Sandero_III_DSC_6012.jpg',
    highlight: 'Económico',
    officeSlug: 'soria',
  },
  {
    slug: 'suzuki-jimny-4x4',
    name: 'Jimny / Vitara',
    brand: 'Suzuki',
    category: 'SUV_4X4',
    seats: 4,
    power: '100 CV',
    fuel: 'GASOLINA',
    transmission: 'MANUAL',
    dailyRate: 70,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/2019_Suzuki_Jimny_SZ5_4X4_Automatic_1.5.jpg/960px-2019_Suzuki_Jimny_SZ5_4X4_Automatic_1.5.jpg',
    highlight: 'Todoterreno 4x4 corto',
    officeSlug: 'soria',
  },
  {
    slug: 'furgoneta-caja-abierta',
    name: 'Daily (Caja Abierta)',
    brand: 'Iveco',
    category: 'FURGONETAS',
    seats: 3,
    power: '130 CV',
    fuel: 'DIESEL',
    transmission: 'MANUAL',
    dailyRate: 122,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/2014_Iveco_Daily_35_S13_MWB_2.3.jpg/960px-2014_Iveco_Daily_35_S13_MWB_2.3.jpg',
    highlight: 'Furgoneta Caja abierta',
    officeSlug: 'soria',
  },
  {
    slug: 'toyota-land-cruiser-largo',
    name: 'Land Cruiser',
    brand: 'Toyota',
    category: 'SUV_4X4',
    seats: 5,
    power: '177 CV',
    fuel: 'DIESEL',
    transmission: 'AUTOMATICO',
    dailyRate: 110,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/2024_Toyota_Land_Cruiser_250_VX_in_Platinum_White_Pearl_Mica%2C_front_left.jpg/960px-2024_Toyota_Land_Cruiser_250_VX_in_Platinum_White_Pearl_Mica%2C_front_left.jpg',
    highlight: 'Todoterreno 4x4 largo',
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
