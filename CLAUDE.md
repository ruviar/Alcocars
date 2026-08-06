# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (raíz)
npm run dev       # Next.js dev en :3000 (rewrite de /api → http://localhost:3001)
npm run build     # next build (SSG/SSR + typecheck)
npm run start     # Servir el build de producción
npm run lint      # ESLint

# Backend (server/)
npm run dev              # Fastify con tsx watch en :3001
npm test                 # Vitest (unit; no requiere base de datos)
npm run db:migrate       # prisma migrate dev (usa DIRECT_URL)
npm run db:seed          # Sembrar oficinas, vehículos y admin
npm run db:studio        # Prisma Studio
```

## Architecture

**Alcocars** — web de alquiler y renting de vehículos (grupo Alcotrans, S.L.) para Zaragoza, Tudela y Ágreda (Soria). Monorepo: **Next.js 15 (App Router)** + React 19 + TypeScript en la raíz, API Fastify 5 + Prisma 6 + PostgreSQL (Supabase) en `server/`.

### Next.js

- Rutas en `src/app/`: grupo `(web)` con el chrome público y `admin/` con el suyo (login fuera del guard, panel dentro de `(panel)`). Los cuerpos de página viven en `src/views/` (¡no `src/pages/`, que activaría el Pages Router!).
- SEO real: `metadata`/`generateMetadata` por ruta, blog y legales SSG (`generateStaticParams`), `app/sitemap.ts` y `app/robots.ts` generados, JSON-LD `AutoRental` en el layout raíz. Fuentes con `next/font` (variables `--font-display/body/mono`).
- Leaflet no soporta SSR: `LocationsMapLazy` y `OfficesPageLazy` cargan con `dynamic({ ssr: false })`.
- El estado inicial de `/reserva` viaja por query (`?gama=&recogida=&desde=&hasta=`, ver `src/lib/reservaQuery.ts`), no por state del router.
- Frontend→API: en dev, rewrite de `next.config.ts`; en prod, `NEXT_PUBLIC_API_BASE_URL` (se hornea en el bundle).

### Fuentes de verdad (¡importante!)

- **Precios y reglas de negocio**: `server/src/config/catalog.ts` (tarifas por gama 1–7 días, extras con unidad `per_rental`/`per_day` y topes, reglas de alquiler). El frontend mantiene copias editoriales en `src/data/tariffs.ts` y `src/data/extras.ts`; el test `server/src/tests/catalog-parity.test.ts` **falla si divergen**. Cualquier cambio de precios se hace en los tres archivos.
- **Datos de empresa y oficinas**: `server/src/config/company.ts` (direcciones, teléfonos, horarios reales). Copia editorial en `src/data/offices.ts`. El seed de Prisma consume `company.ts`.
- El presupuesto de una reserva **siempre se recalcula en el servidor** (`buildQuote`); jamás se confía en importes del navegador.

### Flujo de reserva

1. `BookingEngine` (hero) o `FleetPage`/`TarifasPage` → `router.push(buildReservaHref(...))` (query params).
2. `CheckoutPage` (wizard de 4 pasos) → `POST /api/reservations/checkout` con `{tariffId, oficinas, fechas+horas, plannedKm, extras[{id,quantity}], client, consent}`.
3. El servidor valida (Zod), recalcula el presupuesto, crea `Reservation` en transacción Serializable (con unidad asignada si hay disponibilidad; si no, `needsAvailabilityCheck=true` — **la solicitud nunca se rechaza por falta de hueco**) y envía dos emails vía Brevo: aviso interno (`NOTIFY_EMAIL`) y resguardo al cliente.
4. Todo intento de email queda en la tabla `email_logs` (SENT/FAILED/SKIPPED). Sin `BREVO_API_KEY`, se escribe una vista previa en `server/.mail-preview/` y se registra SKIPPED; la respuesta HTTP informa al frontend con `notification.delivered` para avisar al usuario.
5. Las horas se guardan en UTC convertidas desde Europe/Madrid (`server/src/utils/datetime.ts`, con cambio de hora resuelto y testeado).

### Rutas del frontend (`src/app/`)

`/` · `/flota` · `/tarifas` · `/servicios` · `/sedes` · `/empresa` · `/faqs` · `/blog` · `/blog/:slug` · `/contacto` · `/reserva` · `/legal/:slug` (aviso-legal, politica-privacidad, condiciones-alquiler, politica-cookies) · 404.

`SmartHeader`, `Footer`, `WhatsAppFab` y `CookieBanner` los monta el layout del grupo `(web)`.

### API (`server/src/server.ts`)

Público: `GET /api/health`, `GET /api/catalog`, `GET /api/offices`, `GET /api/vehicles`, `GET /api/reservations/offers`, `POST /api/reservations/checkout`, `GET /api/reservations/code/:code`, `POST /api/contact`.
Admin (JWT): `POST /api/admin/auth/login`, `GET /api/admin/reservations`.

### Styling

CSS Modules por página/componente. Tokens en `src/styles/globals.css`: `--coal` (#F9F9F9 fondo claro), `--chalk` (#012369 azul marino), `--accent` (#AFE23A verde), `--font-display` (Bebas Neue, titulares en mayúsculas), `--font-body` (Inter). Todo el texto visible va en español **con tildes**.

### Env

`server/.env` está en `.gitignore` (contuvo credenciales; fueron expuestas en el historial de git — rotar si no se ha hecho). Plantilla en `server/.env.example`. Variables de email: `BREVO_API_KEY`, `SMTP_FROM` (remitente verificado en Brevo), `NOTIFY_EMAIL`.

### Datos pendientes de confirmar con el cliente

- Teléfono directo de la oficina de Tudela (se usa el central 976 106 100).
- Coordenadas exactas de las oficinas (aproximadas desde la dirección postal).
- CIF y domicilio social de Alcotrans, S.L. para el aviso legal (marcado «[dato pendiente de confirmación]» en `src/data/legalContent.ts`).
