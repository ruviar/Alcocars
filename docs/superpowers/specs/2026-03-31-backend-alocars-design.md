# Alocars Backend — Design Spec
**Date:** 2026-03-31  
**Author:** Senior Software Architect  
**Status:** Approved for implementation

---

## 1. Context

Alocars is a car rental SPA (React 19 + Vite, Spanish UI) targeting Zaragoza, Tudela and Soria. The frontend is fully built with static TypeScript data. This spec covers replacing that static layer with a real RESTful API + PostgreSQL database.

The backend must prevent overbooking (ACID transactions), be easily deployable, and serve the existing React frontend without changes to its routing or component tree — only the data-fetching layer changes.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Node.js 20 LTS | Stable, wide hosting support |
| Framework | **Fastify v5** | 2–3× faster than Express, schema-first, built-in TypeScript |
| Language | TypeScript 5.9 | End-to-end type safety, shared with frontend |
| ORM | **Prisma 6** | Best DX in Node.js ecosystem, migration system, typed queries |
| Database | **PostgreSQL 16** | ACID, row-level locking, production-proven for booking systems |
| Validation | **Zod 3** | Runtime input validation + TypeScript type inference |
| Env config | **dotenv + zod** | Validated env vars at startup, no silent misconfigs |
| CORS | @fastify/cors | Controlled origin allowlist |
| Email | Nodemailer + SMTP | Confirmation emails on reservation |

---

## 3. Project Structure

The backend lives in `server/` inside the existing monorepo. Types can be shared via a `shared/` package.

```
Alocars/
├── src/                          # Frontend (existing, untouched)
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts            # Zod-validated env schema
│   │   ├── db/
│   │   │   └── prisma.ts         # Prisma client singleton
│   │   ├── modules/
│   │   │   ├── offices/
│   │   │   │   ├── offices.router.ts
│   │   │   │   └── offices.service.ts
│   │   │   ├── vehicles/
│   │   │   │   ├── vehicles.router.ts
│   │   │   │   ├── vehicles.service.ts
│   │   │   │   └── vehicles.schema.ts
│   │   │   ├── reservations/
│   │   │   │   ├── reservations.router.ts
│   │   │   │   ├── reservations.service.ts
│   │   │   │   └── reservations.schema.ts
│   │   │   └── contact/
│   │   │       ├── contact.router.ts
│   │   │       ├── contact.service.ts
│   │   │       └── contact.schema.ts
│   │   └── server.ts             # Entry point, plugin registration
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── package.json                  # Root workspace (optional)
```

---

## 4. Database Schema (Prisma)

### Enums

```
VehicleCategory: TURISMOS | FURGONETAS | SUV_4X4 | AUTOCARAVANAS
FuelType:        GASOLINA | DIESEL | ELECTRICO | HIBRIDO
TransmissionType: MANUAL | AUTOMATICO
ReservationStatus: PENDING | CONFIRMED | ACTIVE | COMPLETED | CANCELLED
ExtraType:       BABY_SEAT | SNOW_CHAINS | ADDITIONAL_DRIVER
```

### Entities & Relations

**Office**
- `id` CUID (PK)
- `slug` String UNIQUE — 'zaragoza', 'tudela', 'soria' (matches frontend BookingEngine)
- `city`, `address`, `phone`, `email`, `hours`, `description` String
- `lat`, `lng` Float — replaces the `coords: [lat, lng]` tuple
- → has many `Vehicle`, `Reservation`

**Vehicle**
- `id` CUID (PK)
- `slug` String UNIQUE — 'tesla-model-s', 'ford-transit-custom', etc.
- `name`, `brand`, `highlight`, `imageUrl` String
- `category` VehicleCategory
- `seats` Int
- `power` String — human-readable (e.g. "670 CV", "185 CV")
- `fuel` FuelType enum
- `transmission` TransmissionType
- `dailyRate` Decimal(10,2)
- `isActive` Boolean DEFAULT true — soft-delete for fleet management
- `officeId` FK → Office
- → has many `Reservation`

**Client**
- `id` CUID (PK)
- `firstName`, `lastName`, `phone`, `email` String
- `email` UNIQUE — upsert on checkout (same client can rebook)
- → has many `Reservation`

**Reservation**
- `id` CUID (PK)
- `vehicleId` FK → Vehicle
- `clientId` FK → Client
- `officeId` FK → Office (pickup location)
- `startDate`, `endDate` DateTime
- `totalDays` Int (computed: endDate - startDate in days)
- `dailyRate` Decimal(10,2) — snapshot at time of booking
- `extrasTotal` Decimal(10,2) DEFAULT 0
- `totalAmount` Decimal(10,2) — dailyRate × totalDays + extrasTotal
- `status` ReservationStatus DEFAULT PENDING
- `notes` String? (optional client notes)
- → has many `ReservationExtra`

**ReservationExtra**
- `id` CUID (PK)
- `reservationId` FK → Reservation
- `type` ExtraType
- `pricePerDay` Decimal(10,2)
- `totalPrice` Decimal(10,2)

### Extras Pricing (hardcoded constants in service layer — MVP)
| Extra | Price/day |
|-------|-----------|
| Baby seat (BABY_SEAT) | €8 |
| Snow chains (SNOW_CHAINS) | €5 |
| Additional driver (ADDITIONAL_DRIVER) | €10 |

---

## 5. API Contract

Base URL: `http://localhost:3001/api` (dev) / `https://api.alocars.es/api` (prod)

### Health
```
GET /api/health
→ 200 { status: "ok", uptime: number }
```

### Offices
```
GET /api/offices
→ 200 Office[]
```
Returns all active offices. Used by frontend to populate BookingEngine dropdowns and OfficesPage map.

### Vehicles
```
GET /api/vehicles
  ?officeSlug=zaragoza        (required)
  &startDate=2026-04-01       (required, ISO date)
  &endDate=2026-04-05         (required, ISO date)
  &category=TURISMOS          (optional, omit = all categories)
→ 200 Vehicle[]               (only vehicles NOT booked in that date range)
```
This is the core availability endpoint. Used by CheckoutPage after routing from BookingEngine.

```
GET /api/vehicles/:id
→ 200 Vehicle | 404
```

### Reservations
```
POST /api/reservations/checkout
Body: {
  vehicleId: string
  officeSlug: string
  startDate: string    // ISO date
  endDate: string      // ISO date
  extras: ExtraType[]  // ['BABY_SEAT', 'ADDITIONAL_DRIVER']
  client: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  notes?: string
}
→ 201 { reservationId, totalAmount, confirmationCode }
// confirmationCode format: "ALC-XXXXXXXX" (uppercase alphanumeric, e.g. "ALC-K7M2PQ9R")
→ 409 { error: "VEHICLE_NOT_AVAILABLE" }   // overbooking blocked
→ 422 { error: "VALIDATION_ERROR", details }
```

```
GET /api/reservations/:id
→ 200 ReservationDetail | 404
```
Used to show confirmation page after checkout.

### Contact
```
POST /api/contact
Body: {
  nombre: string
  email: string
  telefono: string
  mensaje: string
}
→ 200 { ok: true }
→ 422 { error: "VALIDATION_ERROR", details }
```

---

## 6. Anti-Overbooking Logic

This is the critical business rule. Implementation uses **PostgreSQL serializable transaction + row-level lock**:

```
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  -- 1. Lock the vehicle row exclusively
  SELECT id, daily_rate FROM vehicles
  WHERE id = $vehicleId AND is_active = true
  FOR UPDATE;

  -- 2. Check for date overlap with non-cancelled reservations
  SELECT COUNT(*) FROM reservations
  WHERE vehicle_id = $vehicleId
    AND status NOT IN ('CANCELLED')
    AND start_date < $endDate      -- overlap condition
    AND end_date   > $startDate;   -- overlap condition (half-open interval)

  -- 3a. If count > 0: ROLLBACK → return 409 VEHICLE_NOT_AVAILABLE
  -- 3b. If count = 0: INSERT reservation + extras → COMMIT → return 201

COMMIT;
```

The overlap check uses the standard **half-open interval** pattern: `[start, end)`. Two reservations overlap if and only if `A.start < B.end AND A.end > B.start`. This handles all edge cases (adjacent bookings on same day are allowed, same-day turnarounds work).

In Prisma, this is wrapped in `prisma.$transaction([...], { isolationLevel: 'Serializable' })`.

---

## 7. Seeding Strategy

20 vehicles distributed across 3 offices, realistic Spanish data:

**Zaragoza (sede central, 9 vehicles):** Tesla Model S, Audi A6, Mercedes Clase E, Mercedes E-Class Coupé, Tesla Model 3, Ford Transit Custom, VW Crafter, Land Rover Defender 110, Mercedes G-Klasse

**Tudela (6 vehicles):** Toyota Hilux, VW California Beach, Seat Arona, Skoda Octavia, Renault Trafic, Citroën Berlingo

**Soria (5 vehicles):** Hymer Globetrotter, Seat Ibiza, Ford Fiesta, Fiat Ducato, Kia Sportage

The seed script uses `prisma db seed` with `upsert` so it is **idempotent** (safe to re-run). It mirrors the exact slugs used in the frontend static data (`v1` → `tesla-model-s`, etc.) to allow a clean migration path.

---

## 8. Frontend Integration Plan

The frontend requires **four targeted changes** to become API-driven:

1. **`src/data/vehicles.ts`** — replace static array with `fetch('/api/vehicles?...')` call (or a custom hook `useVehicles`)
2. **`src/pages/CheckoutPage.tsx`** — replace the fake 1.3s timeout with `fetch('/api/reservations/checkout', { method: 'POST', body: ... })`
3. **`src/pages/ContactPage.tsx`** — replace `setIsSubmitted(true)` with real fetch to `/api/contact`
4. **`src/data/offices.ts`** — replace static array with `fetch('/api/offices')`

Vite is configured to proxy `/api/*` → `http://localhost:3001` in `vite.config.ts` to avoid CORS in development.

---

## 9. Deployment Model

- **Database:** PostgreSQL 16 on [Railway](https://railway.app) or [Supabase](https://supabase.com) (managed, free tier viable for MVP)
- **API server:** Node.js 20 on Railway / Render / Fly.io
- **Frontend:** Vercel (static SPA) or same Railway service
- **Environment variables:** `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `SMTP_*`, `NODE_ENV`

---

## 10. Out of Scope (MVP)

- Admin dashboard / backoffice
- Payment gateway (Stripe) — reservations are "requests", confirmed manually
- Auth / JWT for customers
- Multi-currency / internationalization beyond Spanish
- Vehicle images upload (use Unsplash URLs as in current static data)
