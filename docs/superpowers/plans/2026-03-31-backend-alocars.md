# Alocars Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade RESTful API (Fastify + Prisma + PostgreSQL) inside `server/` to replace the static TypeScript data layer, add availability checking with overbooking prevention, and wire the existing React frontend to it.

**Architecture:** Monorepo — `server/` alongside existing `src/`. Fastify v5 handles HTTP, Prisma 6 owns all DB access, Zod validates all external input. The anti-overbooking mechanism is a PostgreSQL Serializable transaction that re-checks availability inside the same atomic operation as the INSERT.

**Tech Stack:** Node.js 20 · Fastify v5 · TypeScript 5 · Prisma 6 · PostgreSQL 16 · Zod 3 · Vitest 2 · tsx (dev runner)

---

## File Map

**Created by this plan:**

| File | Responsibility |
|------|---------------|
| `server/package.json` | Server package config + scripts |
| `server/tsconfig.json` | TypeScript config for server |
| `server/.env.example` | Environment variable template |
| `server/src/config/env.ts` | Zod-validated env schema, fails fast on bad config |
| `server/src/db/prisma.ts` | PrismaClient singleton |
| `server/prisma/schema.prisma` | Full DB schema: Office, Vehicle, Client, Reservation, ReservationExtra |
| `server/prisma/seed.ts` | Idempotent seed with 20 realistic vehicles across 3 offices |
| `server/src/utils/confirmationCode.ts` | Generates `ALC-XXXXXXXX` codes |
| `server/src/modules/offices/offices.service.ts` | DB queries for offices |
| `server/src/modules/offices/offices.router.ts` | `GET /api/offices` route |
| `server/src/modules/vehicles/vehicles.schema.ts` | Zod schemas for vehicle query params |
| `server/src/modules/vehicles/vehicles.service.ts` | Availability query (NOT IN booked vehicles for date range) |
| `server/src/modules/vehicles/vehicles.router.ts` | `GET /api/vehicles`, `GET /api/vehicles/:id` |
| `server/src/modules/reservations/reservations.schema.ts` | Zod schemas for checkout body |
| `server/src/modules/reservations/reservations.service.ts` | Serializable transaction checkout + anti-overbooking |
| `server/src/modules/reservations/reservations.router.ts` | `POST /api/reservations/checkout`, `GET /api/reservations/:id` |
| `server/src/modules/contact/contact.schema.ts` | Zod schema for contact form body |
| `server/src/modules/contact/contact.service.ts` | Saves contact submission (log for MVP) |
| `server/src/modules/contact/contact.router.ts` | `POST /api/contact` |
| `server/src/server.ts` | Fastify app factory + plugin registration + route mounting |
| `server/src/tests/vehicles.test.ts` | Unit tests: availability query logic |
| `server/src/tests/reservations.test.ts` | Integration tests: checkout + overbooking |
| `server/src/tests/contact.test.ts` | Unit test: contact validation |
| `vite.config.ts` | **Modified** — add `/api` proxy to `localhost:3001` |
| `src/lib/api.ts` | **Created** — typed fetch wrapper for API calls |
| `src/hooks/useOffices.ts` | **Created** — React hook: fetch offices from API |
| `src/hooks/useVehicles.ts` | **Created** — React hook: fetch available vehicles |
| `src/pages/CheckoutPage.tsx` | **Modified** — wire to real POST /api/reservations/checkout |
| `src/pages/ContactPage.tsx` | **Modified** — wire to real POST /api/contact |

---

## Task 1: Server project scaffold

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env.example`

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "alocars-server",
  "version": "1.0.0",
  "description": "Alocars REST API – Fastify + Prisma + PostgreSQL",
  "type": "commonjs",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc --project tsconfig.json",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@prisma/client": "^6.0.0",
    "dotenv": "^16.4.5",
    "fastify": "^5.0.0",
    "nodemailer": "^6.9.14",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/nodemailer": "^6.4.15",
    "prisma": "^6.0.0",
    "tsx": "^4.15.7",
    "typescript": "^5.9.3",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "prisma"]
}
```

- [ ] **Step 3: Create `server/.env.example`**

```ini
# Copy to .env and fill in values
DATABASE_URL="postgresql://postgres:password@localhost:5432/alocars"
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Optional – leave empty to skip email sending in dev
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Alocars <no-reply@alocars.es>"
```

- [ ] **Step 4: Install dependencies**

```bash
cd server && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Commit**

```bash
git add server/package.json server/tsconfig.json server/.env.example
git commit -m "chore: scaffold server project with Fastify + Prisma + Vitest"
```

---

## Task 2: Environment config

**Files:**
- Create: `server/src/config/env.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/env.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('env config', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('throws when DATABASE_URL is missing', async () => {
    vi.stubEnv('DATABASE_URL', '');
    await expect(import('../config/env')).rejects.toThrow();
    vi.unstubAllEnvs();
  });

  it('parses PORT as number and defaults to 3001', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://x:x@localhost:5432/x');
    vi.stubEnv('PORT', '');
    const mod = await import('../config/env');
    expect(mod.env.PORT).toBe(3001);
    vi.unstubAllEnvs();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npm test -- src/tests/env.test.ts
```

Expected: FAIL — `Cannot find module '../config/env'`

- [ ] **Step 3: Create `server/src/config/env.ts`**

```typescript
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd server && npm test -- src/tests/env.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add server/src/config/env.ts server/src/tests/env.test.ts
git commit -m "feat(server): add zod-validated environment config"
```

---

## Task 3: Prisma schema and initial migration

**Files:**
- Create: `server/prisma/schema.prisma`

- [ ] **Step 1: Create `server/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum VehicleCategory {
  TURISMOS
  FURGONETAS
  SUV_4X4
  AUTOCARAVANAS
}

enum FuelType {
  GASOLINA
  DIESEL
  ELECTRICO
  HIBRIDO
}

enum TransmissionType {
  MANUAL
  AUTOMATICO
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  ACTIVE
  COMPLETED
  CANCELLED
}

enum ExtraType {
  BABY_SEAT
  SNOW_CHAINS
  ADDITIONAL_DRIVER
}

model Office {
  id           String        @id @default(cuid())
  slug         String        @unique
  city         String
  address      String
  phone        String
  email        String
  hours        String
  lat          Float
  lng          Float
  description  String
  vehicles     Vehicle[]
  reservations Reservation[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@map("offices")
}

model Vehicle {
  id           String           @id @default(cuid())
  slug         String           @unique
  name         String
  brand        String
  category     VehicleCategory
  seats        Int
  power        String
  fuel         FuelType
  transmission TransmissionType
  dailyRate    Decimal          @db.Decimal(10, 2)
  imageUrl     String
  highlight    String
  isActive     Boolean          @default(true)
  officeId     String
  office       Office           @relation(fields: [officeId], references: [id])
  reservations Reservation[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@index([officeId])
  @@index([category])
  @@index([isActive])
  @@map("vehicles")
}

model Client {
  id           String        @id @default(cuid())
  firstName    String
  lastName     String
  email        String        @unique
  phone        String
  reservations Reservation[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@map("clients")
}

model Reservation {
  id               String            @id @default(cuid())
  confirmationCode String            @unique
  vehicleId        String
  vehicle          Vehicle           @relation(fields: [vehicleId], references: [id])
  clientId         String
  client           Client            @relation(fields: [clientId], references: [id])
  officeId         String
  office           Office            @relation(fields: [officeId], references: [id])
  startDate        DateTime          @db.Date
  endDate          DateTime          @db.Date
  totalDays        Int
  dailyRate        Decimal           @db.Decimal(10, 2)
  extrasTotal      Decimal           @db.Decimal(10, 2) @default(0)
  totalAmount      Decimal           @db.Decimal(10, 2)
  status           ReservationStatus @default(PENDING)
  notes            String?
  extras           ReservationExtra[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@index([vehicleId, startDate, endDate])
  @@index([status])
  @@map("reservations")
}

model ReservationExtra {
  id            String      @id @default(cuid())
  reservationId String
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  type          ExtraType
  pricePerDay   Decimal     @db.Decimal(10, 2)
  totalPrice    Decimal     @db.Decimal(10, 2)

  @@map("reservation_extras")
}
```

- [ ] **Step 2: Copy .env.example to .env and set DATABASE_URL**

```bash
cd server && cp .env.example .env
# Edit server/.env and set DATABASE_URL to your local PostgreSQL connection string
# Example: DATABASE_URL="postgresql://postgres:password@localhost:5432/alocars"
```

Make sure PostgreSQL is running and the `alocars` database exists:
```bash
psql -U postgres -c "CREATE DATABASE alocars;"
```

- [ ] **Step 3: Run first migration**

```bash
cd server && npx prisma migrate dev --name init
```

Expected output: `✔ Generated Prisma Client` and migration applied.

- [ ] **Step 4: Generate Prisma client**

```bash
cd server && npx prisma generate
```

Expected: `✔ Generated Prisma Client (vX.Y.Z)`

- [ ] **Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/
git commit -m "feat(db): add full Prisma schema with Office, Vehicle, Client, Reservation entities"
```

---

## Task 4: Prisma singleton + confirmation code utility

**Files:**
- Create: `server/src/db/prisma.ts`
- Create: `server/src/utils/confirmationCode.ts`

- [ ] **Step 1: Write test for confirmationCode**

Create `server/src/tests/confirmationCode.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateConfirmationCode } from '../utils/confirmationCode';

describe('generateConfirmationCode', () => {
  it('returns a string matching ALC-XXXXXXXX format', () => {
    const code = generateConfirmationCode();
    expect(code).toMatch(/^ALC-[A-Z2-9]{8}$/);
  });

  it('generates unique codes on repeated calls', () => {
    const codes = new Set(Array.from({ length: 100 }, generateConfirmationCode));
    expect(codes.size).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npm test -- src/tests/confirmationCode.test.ts
```

Expected: FAIL — `Cannot find module '../utils/confirmationCode'`

- [ ] **Step 3: Create `server/src/utils/confirmationCode.ts`**

```typescript
import { randomBytes } from 'crypto';

// Unambiguous alphanumeric chars — no I, O, 0, 1
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateConfirmationCode(): string {
  const bytes = randomBytes(8);
  const suffix = Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join('');
  return `ALC-${suffix}`;
}
```

- [ ] **Step 4: Create `server/src/db/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd server && npm test -- src/tests/confirmationCode.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add server/src/db/prisma.ts server/src/utils/confirmationCode.ts server/src/tests/confirmationCode.test.ts
git commit -m "feat(server): add Prisma singleton and confirmation code generator"
```

---

## Task 5: Seed database with 20 realistic vehicles

**Files:**
- Create: `server/prisma/seed.ts`

- [ ] **Step 1: Create `server/prisma/seed.ts`**

```typescript
import { PrismaClient, VehicleCategory, FuelType, TransmissionType } from '@prisma/client';

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

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add seed script to `server/package.json` prisma config**

Add to `server/package.json` (at root level, alongside `"scripts"`):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Run the seed**

```bash
cd server && npm run db:seed
```

Expected output:
```
🌱 Seeding database...
✅ 3 offices seeded
✅ 20 vehicles seeded
🎉 Seeding complete!
```

- [ ] **Step 4: Verify in Prisma Studio (optional)**

```bash
cd server && npm run db:studio
```

Open `http://localhost:5555` and confirm offices + vehicles tables are populated.

- [ ] **Step 5: Commit**

```bash
git add server/prisma/seed.ts server/package.json
git commit -m "feat(db): add idempotent seed with 20 vehicles across 3 offices"
```

---

## Task 6: Offices module

**Files:**
- Create: `server/src/modules/offices/offices.service.ts`
- Create: `server/src/modules/offices/offices.router.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/offices.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service
vi.mock('../../db/prisma', () => ({
  prisma: {
    office: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../db/prisma';
import { getAllOffices } from '../modules/offices/offices.service';

describe('getAllOffices', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns all offices ordered by city', async () => {
    const mockOffices = [
      { id: '1', slug: 'soria', city: 'Soria' },
      { id: '2', slug: 'zaragoza', city: 'Zaragoza' },
    ];
    vi.mocked(prisma.office.findMany).mockResolvedValue(mockOffices as any);

    const result = await getAllOffices();

    expect(prisma.office.findMany).toHaveBeenCalledWith({
      orderBy: { city: 'asc' },
    });
    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npm test -- src/tests/offices.test.ts
```

Expected: FAIL — `Cannot find module '../modules/offices/offices.service'`

- [ ] **Step 3: Create `server/src/modules/offices/offices.service.ts`**

```typescript
import { prisma } from '../../db/prisma';

export async function getAllOffices() {
  return prisma.office.findMany({
    orderBy: { city: 'asc' },
  });
}
```

- [ ] **Step 4: Create `server/src/modules/offices/offices.router.ts`**

```typescript
import type { FastifyInstance } from 'fastify';
import { getAllOffices } from './offices.service';

export async function officesRouter(app: FastifyInstance) {
  app.get('/offices', async (_request, reply) => {
    const offices = await getAllOffices();
    return reply.send(offices);
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd server && npm test -- src/tests/offices.test.ts
```

Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/offices/ server/src/tests/offices.test.ts
git commit -m "feat(api): add GET /api/offices endpoint"
```

---

## Task 7: Vehicles module (availability query)

**Files:**
- Create: `server/src/modules/vehicles/vehicles.schema.ts`
- Create: `server/src/modules/vehicles/vehicles.service.ts`
- Create: `server/src/modules/vehicles/vehicles.router.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/vehicles.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/prisma', () => ({
  prisma: {
    vehicle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../../db/prisma';
import { getAvailableVehicles, getVehicleById } from '../modules/vehicles/vehicles.service';

describe('getAvailableVehicles', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('queries vehicles filtered by office, category, and date overlap exclusion', async () => {
    vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);

    await getAvailableVehicles({
      officeSlug: 'zaragoza',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-05'),
      category: 'TURISMOS',
    });

    expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          office: { slug: 'zaragoza' },
          category: 'TURISMOS',
          NOT: {
            reservations: {
              some: expect.objectContaining({
                status: { not: 'CANCELLED' },
                startDate: { lt: new Date('2026-04-05') },
                endDate: { gt: new Date('2026-04-01') },
              }),
            },
          },
        }),
      }),
    );
  });

  it('omits category filter when not provided', async () => {
    vi.mocked(prisma.vehicle.findMany).mockResolvedValue([]);

    await getAvailableVehicles({
      officeSlug: 'soria',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-05'),
    });

    const call = vi.mocked(prisma.vehicle.findMany).mock.calls[0][0] as any;
    expect(call.where.category).toBeUndefined();
  });
});

describe('getVehicleById', () => {
  it('calls findUnique with the given id', async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);
    await getVehicleById('abc123');
    expect(prisma.vehicle.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'abc123' } }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npm test -- src/tests/vehicles.test.ts
```

Expected: FAIL — `Cannot find module '../modules/vehicles/vehicles.service'`

- [ ] **Step 3: Create `server/src/modules/vehicles/vehicles.schema.ts`**

```typescript
import { z } from 'zod';

export const vehicleQuerySchema = z.object({
  officeSlug: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  category: z.enum(['TURISMOS', 'FURGONETAS', 'SUV_4X4', 'AUTOCARAVANAS']).optional(),
});

export type VehicleQuery = z.infer<typeof vehicleQuerySchema>;
```

- [ ] **Step 4: Create `server/src/modules/vehicles/vehicles.service.ts`**

```typescript
import type { VehicleCategory } from '@prisma/client';
import { prisma } from '../../db/prisma';

export async function getAvailableVehicles(params: {
  officeSlug: string;
  startDate: Date;
  endDate: Date;
  category?: VehicleCategory;
}) {
  const { officeSlug, startDate, endDate, category } = params;

  return prisma.vehicle.findMany({
    where: {
      isActive: true,
      office: { slug: officeSlug },
      ...(category ? { category } : {}),
      NOT: {
        reservations: {
          some: {
            status: { not: 'CANCELLED' },
            startDate: { lt: endDate },   // overlap: existing.start < requested.end
            endDate: { gt: startDate },   // overlap: existing.end   > requested.start
          },
        },
      },
    },
    include: {
      office: { select: { slug: true, city: true } },
    },
    orderBy: { dailyRate: 'asc' },
  });
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: { office: { select: { slug: true, city: true } } },
  });
}
```

- [ ] **Step 5: Create `server/src/modules/vehicles/vehicles.router.ts`**

```typescript
import type { FastifyInstance } from 'fastify';
import { vehicleQuerySchema } from './vehicles.schema';
import { getAvailableVehicles, getVehicleById } from './vehicles.service';

export async function vehiclesRouter(app: FastifyInstance) {
  // GET /api/vehicles?officeSlug=zaragoza&startDate=2026-04-01&endDate=2026-04-05&category=TURISMOS
  app.get('/vehicles', async (request, reply) => {
    const parsed = vehicleQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { officeSlug, startDate, endDate, category } = parsed.data;
    const vehicles = await getAvailableVehicles({
      officeSlug,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      category,
    });

    return reply.send(vehicles);
  });

  // GET /api/vehicles/:id
  app.get<{ Params: { id: string } }>('/vehicles/:id', async (request, reply) => {
    const vehicle = await getVehicleById(request.params.id);
    if (!vehicle) {
      return reply.status(404).send({ error: 'VEHICLE_NOT_FOUND' });
    }
    return reply.send(vehicle);
  });
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd server && npm test -- src/tests/vehicles.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/vehicles/ server/src/tests/vehicles.test.ts
git commit -m "feat(api): add GET /api/vehicles availability endpoint with date-overlap filter"
```

---

## Task 8: Reservations module (anti-overbooking checkout)

**Files:**
- Create: `server/src/modules/reservations/reservations.schema.ts`
- Create: `server/src/modules/reservations/reservations.service.ts`
- Create: `server/src/modules/reservations/reservations.router.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/reservations.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db/prisma', () => {
  const txMock = {
    vehicle: { findFirst: vi.fn() },
    reservation: { findFirst: vi.fn(), create: vi.fn() },
    office: { findUnique: vi.fn() },
    client: { upsert: vi.fn() },
  };
  return {
    prisma: {
      $transaction: vi.fn((fn: any) => fn(txMock)),
      _txMock: txMock,
    },
  };
});

import { prisma } from '../../db/prisma';
import { processCheckout } from '../modules/reservations/reservations.service';

const tx = (prisma as any)._txMock;

const validInput = {
  vehicleId: 'v1',
  officeSlug: 'zaragoza',
  startDate: new Date('2026-05-01'),
  endDate: new Date('2026-05-05'),
  extras: [] as any[],
  client: { firstName: 'Ana', lastName: 'García', email: 'ana@test.es', phone: '+34600000001' },
};

describe('processCheckout', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('throws VEHICLE_NOT_FOUND when vehicle does not exist', async () => {
    tx.vehicle.findFirst.mockResolvedValue(null);

    await expect(processCheckout(validInput)).rejects.toThrow('VEHICLE_NOT_FOUND');
  });

  it('throws VEHICLE_NOT_AVAILABLE when overlap reservation exists', async () => {
    tx.vehicle.findFirst.mockResolvedValue({ id: 'v1', dailyRate: 89 });
    tx.reservation.findFirst.mockResolvedValue({ id: 'conflict' });

    await expect(processCheckout(validInput)).rejects.toThrow('VEHICLE_NOT_AVAILABLE');
  });

  it('creates reservation and returns confirmation when available', async () => {
    tx.vehicle.findFirst.mockResolvedValue({ id: 'v1', dailyRate: '89' });
    tx.reservation.findFirst.mockResolvedValue(null);
    tx.office.findUnique.mockResolvedValue({ id: 'office1' });
    tx.client.upsert.mockResolvedValue({ id: 'client1' });
    tx.reservation.create.mockResolvedValue({
      id: 'res1',
      confirmationCode: 'ALC-TESTCODE',
      totalAmount: '356.00',
      extras: [],
    });

    const result = await processCheckout(validInput);

    expect(result.confirmationCode).toBe('ALC-TESTCODE');
    expect(result.reservationId).toBe('res1');
    expect(tx.reservation.create).toHaveBeenCalledOnce();
  });

  it('throws INVALID_DATE_RANGE when endDate is before startDate', async () => {
    await expect(
      processCheckout({ ...validInput, startDate: new Date('2026-05-10'), endDate: new Date('2026-05-01') }),
    ).rejects.toThrow('INVALID_DATE_RANGE');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npm test -- src/tests/reservations.test.ts
```

Expected: FAIL — `Cannot find module '../modules/reservations/reservations.service'`

- [ ] **Step 3: Create `server/src/modules/reservations/reservations.schema.ts`**

```typescript
import { z } from 'zod';

export const checkoutBodySchema = z.object({
  vehicleId: z.string().min(1),
  officeSlug: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  extras: z
    .array(z.enum(['BABY_SEAT', 'SNOW_CHAINS', 'ADDITIONAL_DRIVER']))
    .default([]),
  client: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
  }),
  notes: z.string().max(500).optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
```

- [ ] **Step 4: Create `server/src/modules/reservations/reservations.service.ts`**

```typescript
import type { ExtraType } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { generateConfirmationCode } from '../../utils/confirmationCode';

// Pricing constants — fixed for MVP
const EXTRAS_PRICING: Record<ExtraType, number> = {
  BABY_SEAT: 8,
  SNOW_CHAINS: 5,
  ADDITIONAL_DRIVER: 10,
};

export async function processCheckout(input: {
  vehicleId: string;
  officeSlug: string;
  startDate: Date;
  endDate: Date;
  extras: ExtraType[];
  client: { firstName: string; lastName: string; email: string; phone: string };
  notes?: string;
}) {
  const { vehicleId, officeSlug, startDate, endDate, extras, client, notes } = input;

  const totalDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (totalDays < 1) throw new Error('INVALID_DATE_RANGE');

  return prisma.$transaction(
    async (tx) => {
      // 1. Verify vehicle exists and is active (locks the row)
      const vehicle = await tx.vehicle.findFirst({
        where: { id: vehicleId, isActive: true },
      });
      if (!vehicle) throw new Error('VEHICLE_NOT_FOUND');

      // 2. Check for any overlapping non-cancelled reservation
      //    Half-open interval: [startDate, endDate)
      //    Overlap iff: existing.startDate < requested.endDate AND existing.endDate > requested.startDate
      const conflict = await tx.reservation.findFirst({
        where: {
          vehicleId,
          status: { not: 'CANCELLED' },
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
      });
      if (conflict) throw new Error('VEHICLE_NOT_AVAILABLE');

      // 3. Resolve office
      const office = await tx.office.findUnique({ where: { slug: officeSlug } });
      if (!office) throw new Error('OFFICE_NOT_FOUND');

      // 4. Upsert client (same email = returning customer)
      const dbClient = await tx.client.upsert({
        where: { email: client.email },
        update: {
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
        },
        create: { ...client },
      });

      // 5. Compute pricing
      const dailyRate = Number(vehicle.dailyRate);
      const extrasData = extras.map((type) => {
        const pricePerDay = EXTRAS_PRICING[type];
        return { type, pricePerDay, totalPrice: pricePerDay * totalDays };
      });
      const extrasTotal = extrasData.reduce((sum, e) => sum + e.totalPrice, 0);
      const totalAmount = dailyRate * totalDays + extrasTotal;

      // 6. Create the reservation + extras atomically
      const reservation = await tx.reservation.create({
        data: {
          confirmationCode: generateConfirmationCode(),
          vehicleId,
          clientId: dbClient.id,
          officeId: office.id,
          startDate,
          endDate,
          totalDays,
          dailyRate,
          extrasTotal,
          totalAmount,
          notes,
          extras: { create: extrasData },
        },
        include: { extras: true },
      });

      return {
        reservationId: reservation.id,
        confirmationCode: reservation.confirmationCode,
        totalAmount: reservation.totalAmount,
      };
    },
    { isolationLevel: 'Serializable' },
  );
}

export async function getReservationById(id: string) {
  return prisma.reservation.findUnique({
    where: { id },
    include: {
      vehicle: {
        select: { name: true, brand: true, imageUrl: true, dailyRate: true },
      },
      client: {
        select: { firstName: true, lastName: true, email: true },
      },
      office: {
        select: { city: true, address: true, phone: true },
      },
      extras: true,
    },
  });
}
```

- [ ] **Step 5: Create `server/src/modules/reservations/reservations.router.ts`**

```typescript
import type { FastifyInstance } from 'fastify';
import { checkoutBodySchema } from './reservations.schema';
import { processCheckout, getReservationById } from './reservations.service';

export async function reservationsRouter(app: FastifyInstance) {
  // POST /api/reservations/checkout
  app.post('/reservations/checkout', async (request, reply) => {
    const parsed = checkoutBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { startDate, endDate, extras, ...rest } = parsed.data;

    try {
      const result = await processCheckout({
        ...rest,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        extras,
      });
      return reply.status(201).send(result);
    } catch (err: any) {
      if (err.message === 'VEHICLE_NOT_AVAILABLE') {
        return reply.status(409).send({ error: 'VEHICLE_NOT_AVAILABLE' });
      }
      if (err.message === 'VEHICLE_NOT_FOUND') {
        return reply.status(404).send({ error: 'VEHICLE_NOT_FOUND' });
      }
      if (err.message === 'OFFICE_NOT_FOUND') {
        return reply.status(404).send({ error: 'OFFICE_NOT_FOUND' });
      }
      throw err; // unexpected — let Fastify handle as 500
    }
  });

  // GET /api/reservations/:id
  app.get<{ Params: { id: string } }>('/reservations/:id', async (request, reply) => {
    const reservation = await getReservationById(request.params.id);
    if (!reservation) {
      return reply.status(404).send({ error: 'RESERVATION_NOT_FOUND' });
    }
    return reply.send(reservation);
  });
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd server && npm test -- src/tests/reservations.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/reservations/ server/src/tests/reservations.test.ts
git commit -m "feat(api): add POST /api/reservations/checkout with serializable transaction anti-overbooking"
```

---

## Task 9: Contact module

**Files:**
- Create: `server/src/modules/contact/contact.schema.ts`
- Create: `server/src/modules/contact/contact.service.ts`
- Create: `server/src/modules/contact/contact.router.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/contact.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { contactBodySchema } from '../modules/contact/contact.schema';

describe('contactBodySchema', () => {
  it('accepts valid contact form data', () => {
    const result = contactBodySchema.safeParse({
      nombre: 'Ana García',
      email: 'ana@test.es',
      telefono: '+34600000001',
      mensaje: 'Hola, necesito información.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = contactBodySchema.safeParse({
      nombre: 'Ana',
      email: 'not-an-email',
      telefono: '+34600000001',
      mensaje: 'Hola',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty mensaje', () => {
    const result = contactBodySchema.safeParse({
      nombre: 'Ana',
      email: 'ana@test.es',
      telefono: '+34600000001',
      mensaje: '',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npm test -- src/tests/contact.test.ts
```

Expected: FAIL — `Cannot find module '../modules/contact/contact.schema'`

- [ ] **Step 3: Create `server/src/modules/contact/contact.schema.ts`**

```typescript
import { z } from 'zod';

export const contactBodySchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(6, 'Teléfono requerido'),
  mensaje: z.string().min(1, 'Mensaje requerido').max(2000),
});

export type ContactBody = z.infer<typeof contactBodySchema>;
```

- [ ] **Step 4: Create `server/src/modules/contact/contact.service.ts`**

```typescript
import type { ContactBody } from './contact.schema';

export async function processContactForm(data: ContactBody): Promise<void> {
  // MVP: log to console. Replace with Nodemailer when SMTP is configured.
  console.log('[CONTACT FORM]', {
    from: data.email,
    name: data.nombre,
    phone: data.telefono,
    message: data.mensaje,
    receivedAt: new Date().toISOString(),
  });
}
```

- [ ] **Step 5: Create `server/src/modules/contact/contact.router.ts`**

```typescript
import type { FastifyInstance } from 'fastify';
import { contactBodySchema } from './contact.schema';
import { processContactForm } from './contact.service';

export async function contactRouter(app: FastifyInstance) {
  app.post('/contact', async (request, reply) => {
    const parsed = contactBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    await processContactForm(parsed.data);
    return reply.send({ ok: true });
  });
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd server && npm test -- src/tests/contact.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/contact/ server/src/tests/contact.test.ts
git commit -m "feat(api): add POST /api/contact endpoint with Zod validation"
```

---

## Task 10: Fastify server entry point

**Files:**
- Create: `server/src/server.ts`

- [ ] **Step 1: Create `server/src/server.ts`**

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { officesRouter } from './modules/offices/offices.router';
import { vehiclesRouter } from './modules/vehicles/vehicles.router';
import { reservationsRouter } from './modules/reservations/reservations.router';
import { contactRouter } from './modules/contact/contact.router';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport:
        env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // CORS — allow the Vite dev server and production frontend origin
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // Health check
  app.get('/api/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  // API routes — all prefixed with /api
  await app.register(officesRouter, { prefix: '/api' });
  await app.register(vehiclesRouter, { prefix: '/api' });
  await app.register(reservationsRouter, { prefix: '/api' });
  await app.register(contactRouter, { prefix: '/api' });

  return app;
}

// Only start server when run directly (not when imported by tests)
if (require.main === module) {
  buildApp().then((app) => {
    app.listen({ port: env.PORT, host: '0.0.0.0' }, (err) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
    });
  });
}
```

- [ ] **Step 2: Install pino-pretty for readable dev logs**

```bash
cd server && npm install --save-dev pino-pretty
```

- [ ] **Step 3: Start the dev server and verify all routes**

```bash
cd server && npm run dev
```

In another terminal, run these checks:

```bash
# Health
curl http://localhost:3001/api/health
# Expected: {"status":"ok","uptime":...}

# Offices
curl http://localhost:3001/api/offices
# Expected: Array of 3 offices

# Available vehicles (Zaragoza, April 2026)
curl "http://localhost:3001/api/vehicles?officeSlug=zaragoza&startDate=2026-04-01&endDate=2026-04-05"
# Expected: Array of 9 Zaragoza vehicles (none booked yet)

# Validation error
curl -X POST http://localhost:3001/api/contact -H "Content-Type: application/json" -d '{}'
# Expected: {"error":"VALIDATION_ERROR","details":{...}}
```

- [ ] **Step 4: Commit**

```bash
git add server/src/server.ts server/package.json
git commit -m "feat(server): wire Fastify app with all API routes and CORS"
```

---

## Task 11: Run all tests

- [ ] **Step 1: Run full test suite**

```bash
cd server && npm test
```

Expected: All tests pass. Output should show:
```
✓ src/tests/env.test.ts (2)
✓ src/tests/confirmationCode.test.ts (2)
✓ src/tests/offices.test.ts (1)
✓ src/tests/vehicles.test.ts (3)
✓ src/tests/reservations.test.ts (4)
✓ src/tests/contact.test.ts (3)

Test Files  6 passed (6)
Tests       15 passed (15)
```

- [ ] **Step 2: Commit if everything passes**

```bash
git add -A
git commit -m "test(server): all 15 unit tests passing"
```

---

## Task 12: Frontend — Vite proxy + API client

**Files:**
- Modify: `vite.config.ts`
- Create: `src/lib/api.ts`

- [ ] **Step 1: Read current vite.config.ts**

```bash
cat vite.config.ts
```

- [ ] **Step 2: Add proxy to `vite.config.ts`**

The file currently looks like:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

Replace with:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: Create `src/lib/api.ts`**

```typescript
// Typed API client — all backend calls go through this module.
// In development, Vite proxies /api → localhost:3001.
// In production, set VITE_API_BASE_URL to the deployed API origin.

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error ?? `HTTP ${res.status}`);
    (error as any).status = res.status;
    (error as any).details = body.details;
    throw error;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
```

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts src/lib/api.ts
git commit -m "feat(frontend): add Vite API proxy and typed api client"
```

---

## Task 13: Frontend hooks — offices and vehicles

**Files:**
- Create: `src/hooks/useOffices.ts`
- Create: `src/hooks/useVehicles.ts`

- [ ] **Step 1: Create `src/hooks/useOffices.ts`**

```typescript
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export type ApiOffice = {
  id: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  lat: number;
  lng: number;
  description: string;
};

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ApiOffice[] }
  | { status: 'error'; message: string };

export function useOffices() {
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    setState({ status: 'loading' });
    api
      .get<ApiOffice[]>('/api/offices')
      .then((data) => setState({ status: 'success', data }))
      .catch((err) => setState({ status: 'error', message: err.message }));
  }, []);

  return state;
}
```

- [ ] **Step 2: Create `src/hooks/useVehicles.ts`**

```typescript
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export type ApiVehicle = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: 'TURISMOS' | 'FURGONETAS' | 'SUV_4X4' | 'AUTOCARAVANAS';
  seats: number;
  power: string;
  fuel: 'GASOLINA' | 'DIESEL' | 'ELECTRICO' | 'HIBRIDO';
  transmission: 'MANUAL' | 'AUTOMATICO';
  dailyRate: string; // Prisma Decimal serializes as string
  imageUrl: string;
  highlight: string;
  isActive: boolean;
  office: { slug: string; city: string };
};

type Params = {
  officeSlug: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  category?: string;
};

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ApiVehicle[] }
  | { status: 'error'; message: string };

export function useVehicles(params: Params | null) {
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    if (!params) return;

    const qs = new URLSearchParams({
      officeSlug: params.officeSlug,
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.category && params.category !== 'Cualquier tipo'
        ? { category: params.category.replace('4×4', 'SUV_4X4').toUpperCase() }
        : {}),
    });

    setState({ status: 'loading' });
    api
      .get<ApiVehicle[]>(`/api/vehicles?${qs}`)
      .then((data) => setState({ status: 'success', data }))
      .catch((err) => setState({ status: 'error', message: err.message }));
  }, [params?.officeSlug, params?.startDate, params?.endDate, params?.category]);

  return state;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useOffices.ts src/hooks/useVehicles.ts
git commit -m "feat(frontend): add useOffices and useVehicles hooks wired to the API"
```

---

## Task 14: Wire CheckoutPage to real API

**Files:**
- Modify: `src/pages/CheckoutPage.tsx`

- [ ] **Step 1: Read `src/pages/CheckoutPage.tsx`**

File already read earlier. Key changes needed:
- Replace the fake `setTimeout` in `handleSubmit` with a real `POST /api/reservations/checkout` call.
- The checkout page currently doesn't have a selected `vehicleId` — the `BookingEngine` state only contains `location`, `dateRange`, and `vehicleType`. For MVP, add `vehicleId` to the router state (passed from a vehicle selection step) OR show available vehicles on the checkout page.

For MVP, the simplest correct approach: add a vehicle selection section at the top of CheckoutPage that calls `useVehicles` and lets the user pick one before submitting.

- [ ] **Step 2: Modify `src/pages/CheckoutPage.tsx`**

Replace the `handleSubmit` function and add vehicle selection. The complete modified file:

```typescript
import {
  useEffect, useMemo, useRef, useState,
  type ChangeEvent, type FormEvent,
} from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { gsap } from 'gsap';
import type { DateRange } from 'react-day-picker';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useVehicles, type ApiVehicle } from '../hooks/useVehicles';
import styles from './CheckoutPage.module.css';

type CheckoutState = {
  dateRange?: DateRange;
  location?: string;
  vehicleType?: string;
};

type ExtraKey = 'babySeat' | 'snowChains' | 'additionalDriver';

type CustomerData = {
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
};

const extrasConfig: Array<{ key: ExtraKey; label: string; apiKey: string }> = [
  { key: 'babySeat', label: 'Silla de bebé', apiKey: 'BABY_SEAT' },
  { key: 'snowChains', label: 'Cadenas de nieve', apiKey: 'SNOW_CHAINS' },
  { key: 'additionalDriver', label: 'Conductor adicional', apiKey: 'ADDITIONAL_DRIVER' },
];

const initialCustomerData: CustomerData = {
  nombre: '', apellidos: '', telefono: '', email: '',
};

const initialExtrasState: Record<ExtraKey, boolean> = {
  babySeat: false, snowChains: false, additionalDriver: false,
};

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateRangeLabel(dateRange: DateRange | undefined) {
  if (!dateRange?.from) return 'Fechas por confirmar';
  const fromLabel = capitalizeFirst(format(dateRange.from, 'd MMM', { locale: es }));
  const toDate = dateRange.to ?? dateRange.from;
  const toLabel = capitalizeFirst(format(toDate, 'd MMM', { locale: es }));
  return `Del ${fromLabel} al ${toLabel}`;
}

function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [customerData, setCustomerData] = useState<CustomerData>(initialCustomerData);
  const [extras, setExtras] = useState<Record<ExtraKey, boolean>>(initialExtrasState);
  const [selectedVehicle, setSelectedVehicle] = useState<ApiVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);

  const bookingState = state as CheckoutState | null;
  const pickupLocation = bookingState?.location;
  const selectedVehicleType = bookingState?.vehicleType;
  const selectedDateRange = bookingState?.dateRange;

  const hasSearchState = Boolean(
    bookingState && pickupLocation && selectedVehicleType && selectedDateRange?.from,
  );

  const formattedDates = useMemo(
    () => formatDateRangeLabel(selectedDateRange),
    [selectedDateRange],
  );

  // Build vehicle query params from booking state
  const vehicleParams = useMemo(() => {
    if (!hasSearchState || !selectedDateRange?.from || !selectedDateRange?.to || !pickupLocation) {
      return null;
    }
    return {
      officeSlug: pickupLocation.toLowerCase(),
      startDate: toISODate(selectedDateRange.from),
      endDate: toISODate(selectedDateRange.to),
      category: selectedVehicleType !== 'Cualquier tipo' ? selectedVehicleType : undefined,
    };
  }, [hasSearchState, pickupLocation, selectedDateRange, selectedVehicleType]);

  const vehiclesState = useVehicles(vehicleParams);

  useEffect(() => {
    if (!hasSearchState || !pageRef.current) return;
    const ctx = gsap.context(() => {
      if (summaryRef.current) {
        gsap.fromTo(summaryRef.current, { x: -56, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' });
      }
      if (formRef.current) {
        gsap.fromTo(formRef.current, { x: 56, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', delay: 0.08 });
      }
    }, pageRef);
    return () => ctx.revert();
  }, [hasSearchState]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
    if (isSubmitted) setIsSubmitted(false);
    if (submitError) setSubmitError(null);
  };

  const handleExtraToggle = (key: ExtraKey) => {
    setExtras((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || !selectedVehicle || !selectedDateRange?.from || !selectedDateRange?.to) return;

    setIsLoading(true);
    setSubmitError(null);

    const activeExtras = extrasConfig
      .filter((e) => extras[e.key])
      .map((e) => e.apiKey);

    try {
      const result = await api.post<{ reservationId: string; confirmationCode: string; totalAmount: string }>(
        '/api/reservations/checkout',
        {
          vehicleId: selectedVehicle.id,
          officeSlug: pickupLocation!.toLowerCase(),
          startDate: toISODate(selectedDateRange.from),
          endDate: toISODate(selectedDateRange.to),
          extras: activeExtras,
          client: {
            firstName: customerData.nombre,
            lastName: customerData.apellidos,
            email: customerData.email,
            phone: customerData.telefono,
          },
        },
      );
      setConfirmationCode(result.confirmationCode);
      setIsSubmitted(true);
    } catch (err: any) {
      if (err.status === 409) {
        setSubmitError('Este vehículo ya no está disponible para estas fechas. Por favor, elige otro.');
      } else {
        setSubmitError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasSearchState) {
    return (
      <main className={styles.emptyPage}>
        <section className={styles.emptyCard} aria-live="polite">
          <p className={styles.emptyKicker}>Reserva</p>
          <h1 className={styles.emptyTitle}>Empieza desde el buscador</h1>
          <p className={styles.emptyText}>
            No encontramos datos de fechas, ciudad o categoría. Vuelve al inicio y completa la búsqueda para
            continuar con tu reserva.
          </p>
          <button type="button" className={styles.emptyButton} onClick={() => navigate('/')}>
            Ir al buscador
          </button>
        </section>
      </main>
    );
  }

  return (
    <main ref={pageRef} className={styles.page}>
      <div className={styles.layout}>
        <section ref={summaryRef} className={styles.summaryColumn} aria-label="Resumen de tu viaje">
          <p className={styles.kicker}>Resumen de tu viaje</p>
          <h1 className={styles.title}>CHECKOUT</h1>

          <article className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Fechas</span>
              <strong className={styles.summaryValue}>{formattedDates}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Recogida</span>
              <strong className={styles.summaryValue}>{pickupLocation}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Categoría</span>
              <strong className={styles.summaryValue}>{selectedVehicleType}</strong>
            </div>
            {selectedVehicle && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Vehículo</span>
                <strong className={styles.summaryValue}>{selectedVehicle.brand} {selectedVehicle.name}</strong>
              </div>
            )}
          </article>

          {/* Vehicle selection */}
          <article className={styles.extrasCard}>
            <h2 className={styles.extrasTitle}>Elige tu vehículo</h2>
            {vehiclesState.status === 'loading' && <p>Buscando disponibilidad...</p>}
            {vehiclesState.status === 'error' && <p>Error al cargar vehículos.</p>}
            {vehiclesState.status === 'success' && vehiclesState.data.length === 0 && (
              <p>No hay vehículos disponibles para estas fechas y sede.</p>
            )}
            {vehiclesState.status === 'success' && vehiclesState.data.map((v) => (
              <label
                key={v.id}
                className={`${styles.extraItem} ${selectedVehicle?.id === v.id ? styles.extraItemSelected : ''}`}
              >
                <span className={styles.extraLabel}>
                  {v.brand} {v.name} — {v.highlight} — €{Number(v.dailyRate).toFixed(0)}/día
                </span>
                <input
                  className={styles.extraInput}
                  type="radio"
                  name="vehicle"
                  checked={selectedVehicle?.id === v.id}
                  onChange={() => setSelectedVehicle(v)}
                />
              </label>
            ))}
          </article>

          <article className={styles.extrasCard}>
            <h2 className={styles.extrasTitle}>Extras</h2>
            <p className={styles.extrasText}>Añade complementos para que el viaje se adapte a ti.</p>
            <div className={styles.extrasList}>
              {extrasConfig.map((extra) => (
                <label key={extra.key} className={styles.extraItem}>
                  <span className={styles.extraLabel}>{extra.label}</span>
                  <input
                    className={styles.extraInput}
                    type="checkbox"
                    checked={extras[extra.key]}
                    onChange={() => handleExtraToggle(extra.key)}
                  />
                  <span className={styles.extraToggle} aria-hidden="true">
                    <span className={styles.extraThumb} />
                  </span>
                </label>
              ))}
            </div>
          </article>
        </section>

        <section ref={formRef} className={styles.formColumn} aria-label="Tus datos de reserva">
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>Tus datos</h2>

            <label className={styles.field}>
              <span>Nombre</span>
              <input type="text" name="nombre" value={customerData.nombre} onChange={handleInputChange} placeholder="Tu nombre" required />
            </label>
            <label className={styles.field}>
              <span>Apellidos</span>
              <input type="text" name="apellidos" value={customerData.apellidos} onChange={handleInputChange} placeholder="Tus apellidos" required />
            </label>
            <label className={styles.field}>
              <span>Teléfono</span>
              <input type="tel" name="telefono" value={customerData.telefono} onChange={handleInputChange} placeholder="+34 600 000 000" required />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input type="email" name="email" value={customerData.email} onChange={handleInputChange} placeholder="tu@email.com" required />
            </label>

            <button type="submit" className={styles.submitButton} disabled={isLoading || !selectedVehicle}>
              {isLoading ? (
                <span className={styles.loadingWrap}>
                  <span className={styles.spinner} aria-hidden="true" />
                  Procesando...
                </span>
              ) : (
                'SOLICITAR VEHÍCULO'
              )}
            </button>

            {submitError && (
              <p className={styles.error} role="alert" aria-live="assertive">{submitError}</p>
            )}

            {isSubmitted && confirmationCode && (
              <p className={styles.success} role="status" aria-live="polite">
                ¡Reserva confirmada! Código: <strong>{confirmationCode}</strong>. Te contactaremos en breve.
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Add `.error` CSS class to `src/pages/CheckoutPage.module.css`**

Read the file and append at the end:

```css
.error {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(255, 80, 80, 0.12);
  border: 1px solid rgba(255, 80, 80, 0.3);
  color: #ff6b6b;
  font-size: 0.875rem;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/CheckoutPage.tsx src/pages/CheckoutPage.module.css
git commit -m "feat(frontend): wire CheckoutPage to real API — vehicle selection + checkout POST"
```

---

## Task 15: Wire ContactPage to real API

**Files:**
- Modify: `src/pages/ContactPage.tsx`

- [ ] **Step 1: Replace the `handleSubmit` in `src/pages/ContactPage.tsx`**

Change only the `handleSubmit` function and add an error state. Replace:

```typescript
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
```

With:

```typescript
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
```

Add `import { api } from '../lib/api';` at the top of the file.

Replace the existing `handleSubmit`:

```typescript
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setSubmitError(null);
    try {
      await api.post('/api/contact', formData);
      setFormData(initialFormData);
      setIsSubmitted(true);
    } catch {
      setSubmitError('No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };
```

Replace the submit button:

```typescript
  <button className={styles.submitButton} type="submit" disabled={isLoading}>
    {isLoading ? 'Enviando...' : 'Enviar solicitud'}
  </button>

  {submitError && (
    <p className={styles.error} role="alert" aria-live="assertive">{submitError}</p>
  )}
```

- [ ] **Step 2: Add `.error` class to `src/pages/ContactPage.module.css`**

Append at end of file:

```css
.error {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(255, 80, 80, 0.12);
  border: 1px solid rgba(255, 80, 80, 0.3);
  color: #ff6b6b;
  font-size: 0.875rem;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ContactPage.tsx src/pages/ContactPage.module.css
git commit -m "feat(frontend): wire ContactPage to real POST /api/contact"
```

---

## Task 16: End-to-end smoke test

- [ ] **Step 1: Start both servers**

Terminal 1:
```bash
cd server && npm run dev
# Expected: Server listening on port 3001
```

Terminal 2:
```bash
npm run dev
# Expected: Vite dev server on http://localhost:5173
```

- [ ] **Step 2: Test the full booking flow in the browser**

1. Open `http://localhost:5173`
2. In BookingEngine: select **Zaragoza**, any future date range, any vehicle type → click **Buscar**
3. On `/reserva`: verify vehicles load from API (not static data)
4. Select a vehicle, fill in personal data, select an extra → click **SOLICITAR VEHÍCULO**
5. Verify confirmation code appears (format: `ALC-XXXXXXXX`)
6. Open `http://localhost:5173/contacto`, fill in form → click **Enviar solicitud**
7. Verify the server logs the contact submission in terminal 1

- [ ] **Step 3: Test overbooking prevention**

```bash
# Make a reservation directly via curl
curl -s -X POST http://localhost:3001/api/reservations/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "<id from GET /api/vehicles>",
    "officeSlug": "zaragoza",
    "startDate": "2026-06-01",
    "endDate": "2026-06-05",
    "extras": [],
    "client": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@alocars.es",
      "phone": "+34600000099"
    }
  }'
# Expected: 201 with confirmationCode

# Try to book the same vehicle for overlapping dates
# Expected: 409 {"error":"VEHICLE_NOT_AVAILABLE"}
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Alocars backend — Fastify API + PostgreSQL + frontend wired"
```

---

## Self-Review Notes

- Spec §4 (DB schema) → Tasks 3, 4 ✓
- Spec §5 (API contract) → Tasks 6, 7, 8, 9, 10 ✓
- Spec §6 (anti-overbooking) → Task 8 `processCheckout` Serializable transaction ✓
- Spec §7 (seeding 20 vehicles) → Task 5 ✓
- Spec §8 (frontend integration) → Tasks 12–15 ✓
- `confirmationCode` format `ALC-XXXXXXXX` → Task 4 utility ✓
- Extras pricing constants → Task 8 `EXTRAS_PRICING` constant ✓
- `power` as String, `fuel` as FuelType enum → Task 3 schema ✓
