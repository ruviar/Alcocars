# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (raíz)
npm run dev       # Vite dev server (proxy /api → http://localhost:3001)
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # Previsualizar build de producción

# Backend (server/)
npm run dev              # Fastify con tsx watch en :3001
npm test                 # Vitest (unit; no requiere base de datos)
npm run db:migrate       # prisma migrate dev (usa DIRECT_URL)
npm run db:seed          # Sembrar oficinas, vehículos y admin
npm run db:studio        # Prisma Studio
```

## Architecture

**Alcocars** — web de alquiler y renting de vehículos (grupo Alcotrans, S.L.) para Zaragoza, Tudela y Ágreda (Soria). Monorepo: SPA React 19 + TypeScript + Vite en la raíz, API Fastify 5 + Prisma 6 + PostgreSQL (Supabase) en `server/`.

### Fuentes de verdad (¡importante!)

- **Precios y reglas de negocio**: `server/src/config/catalog.ts` (tarifas por gama 1–7 días, extras con unidad `per_rental`/`per_day` y topes, reglas de alquiler). El frontend mantiene copias editoriales en `src/data/tariffs.ts` y `src/data/extras.ts`; el test `server/src/tests/catalog-parity.test.ts` **falla si divergen**. Cualquier cambio de precios se hace en los tres archivos.
- **Datos de empresa y oficinas**: `server/src/config/company.ts` (direcciones, teléfonos, horarios reales). Copia editorial en `src/data/offices.ts`. El seed de Prisma consume `company.ts`.
- El presupuesto de una reserva **siempre se recalcula en el servidor** (`buildQuote`); jamás se confía en importes del navegador.

### Flujo de reserva

1. `BookingEngine` (hero) o `FleetPage`/`TarifasPage` → `navigate('/reserva', { state })`.
2. `CheckoutPage` (wizard de 4 pasos) → `POST /api/reservations/checkout` con `{tariffId, oficinas, fechas+horas, plannedKm, extras[{id,quantity}], client, consent}`.
3. El servidor valida (Zod), recalcula el presupuesto, crea `Reservation` en transacción Serializable (con unidad asignada si hay disponibilidad; si no, `needsAvailabilityCheck=true` — **la solicitud nunca se rechaza por falta de hueco**) y envía dos emails vía Brevo: aviso interno (`NOTIFY_EMAIL`) y resguardo al cliente.
4. Todo intento de email queda en la tabla `email_logs` (SENT/FAILED/SKIPPED). Sin `BREVO_API_KEY`, se escribe una vista previa en `server/.mail-preview/` y se registra SKIPPED; la respuesta HTTP informa al frontend con `notification.delivered` para avisar al usuario.
5. Las horas se guardan en UTC convertidas desde Europe/Madrid (`server/src/utils/datetime.ts`, con cambio de hora resuelto y testeado).

### Rutas del frontend (`src/App.tsx`)

`/` · `/flota` · `/tarifas` · `/servicios` · `/sedes` · `/empresa` · `/faqs` · `/blog` · `/blog/:slug` · `/contacto` · `/reserva` · `/legal/:slug` (aviso-legal, politica-privacidad, condiciones-alquiler, politica-cookies) · 404.

`SmartHeader`, `Footer`, `WhatsAppFab`, `CookieBanner`, `RouteMeta` (title/description por ruta) y `ScrollToTop` son globales.

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
