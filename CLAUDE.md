# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Todo desde la raíz: web y API son la misma aplicación
npm run dev              # Next.js dev en :3000 (web + API en /api)
npm run build            # prisma generate && next build
npm run start            # Servir el build de producción
npm run lint             # ESLint
npm test                 # Vitest (unit; no requiere base de datos)
npm run db:migrate       # prisma migrate dev (usa DIRECT_URL)
npm run db:migrate:deploy # Aplicar migraciones en producción
npm run db:seed          # Sembrar oficinas, vehículos y admin
npm run db:studio        # Prisma Studio
npm run admin:password -- '<contraseña>' [email]   # Cambiar la clave del panel
```

## Architecture

**Alcocars** — web de alquiler y renting de vehículos (grupo Alcotrans, S.L.) para Zaragoza, Tudela y Ágreda (Soria). **Una sola aplicación Next.js 15 (App Router)** + React 19 + TypeScript: la web y la API viven juntas y se despliegan en Vercel de una vez. Prisma 6 + PostgreSQL (Supabase). No hay backend separado ni CORS.

### Next.js

- Rutas en `src/app/`: grupo `(web)` con el chrome público y `admin/` con el suyo (login fuera del guard, panel dentro de `(panel)`). Los cuerpos de página viven en `src/views/` (¡no `src/pages/`, que activaría el Pages Router!).
- SEO real: `metadata`/`generateMetadata` por ruta, blog y legales SSG (`generateStaticParams`), `app/sitemap.ts` y `app/robots.ts` generados, JSON-LD `AutoRental` en el layout raíz. Fuentes con `next/font` (variables `--font-display/body/mono`).
- Leaflet no soporta SSR: `LocationsMapLazy` y `OfficesPageLazy` cargan con `dynamic({ ssr: false })`.
- El estado inicial de `/reserva` viaja por query (`?gama=&recogida=&desde=&hasta=`, ver `src/lib/reservaQuery.ts`), no por state del router.
- **API en `src/app/api/**/route.ts`** (20 endpoints). La lógica de negocio está en `src/server/` y no sabe nada de HTTP: `config/` (catálogo y empresa), `modules/*/**.service.ts`, `utils/` (mailer, fechas), `db/prisma.ts`. Las rutas son envoltorios finos con los helpers de `src/server/http.ts` (`parseJsonBody`, `parseQuery`, `requireAdmin`, `businessError`, `withErrorLogging`).
- **Sesión del panel en cookie `httpOnly`** (`src/server/auth/session.ts`, firmada con `jose`): el JavaScript no puede leer el token. `GET /api/admin/session` es la autoridad sobre si hay sesión; `localStorage` solo cachea el nombre para pintar la barra lateral.
- Serverless: `env.ts` valida de forma perezosa y **nunca hace `process.exit()`**; `bcryptjs` en vez de `bcrypt` (sin binarios nativos); la vista previa de emails solo se escribe en local (el disco es de solo lectura en Vercel). `DATABASE_URL` debe llevar `?pgbouncer=true&connection_limit=1`.
- Rutas relativas al llamar la API (mismo origen), sin variable de URL de backend.

### Fuentes de verdad (¡importante!)

- **Precios y reglas de negocio**: `src/server/config/catalog.ts` (tarifas por gama 1–7 días, extras con unidad `per_rental`/`per_day` y topes, reglas de alquiler). El frontend mantiene copias editoriales en `src/data/tariffs.ts` y `src/data/extras.ts`; el test `src/server/tests/catalog-parity.test.ts` **falla si divergen**. Cualquier cambio de precios se hace en los tres archivos.
- **Datos de empresa y oficinas**: `src/server/config/company.ts` (direcciones, teléfonos, horarios reales). Copia editorial en `src/data/offices.ts`. El seed de Prisma consume `company.ts`.
- El presupuesto de una reserva **siempre se recalcula en el servidor** (`buildQuote`); jamás se confía en importes del navegador.

### Flujo de reserva

1. `BookingEngine` (hero) o `FleetPage`/`TarifasPage` → `router.push(buildReservaHref(...))` (query params).
2. `CheckoutPage` (wizard de 4 pasos) → `POST /api/reservations/checkout` con `{tariffId, oficinas, fechas+horas, plannedKm, extras[{id,quantity}], client, consent}`.
3. El servidor valida (Zod), recalcula el presupuesto, crea `Reservation` en transacción Serializable (con unidad asignada si hay disponibilidad; si no, `needsAvailabilityCheck=true` — **la solicitud nunca se rechaza por falta de hueco**) y envía dos emails vía Brevo: aviso interno (`NOTIFY_EMAIL`) y resguardo al cliente.
4. Todo intento de email queda en la tabla `email_logs` (SENT/FAILED/SKIPPED). Sin `BREVO_API_KEY`, se escribe una vista previa en `.mail-preview/` (solo en local) y se registra SKIPPED; la respuesta HTTP informa al frontend con `notification.delivered` para avisar al usuario.
5. Las horas se guardan en UTC convertidas desde Europe/Madrid (`src/server/utils/datetime.ts`, con cambio de hora resuelto y testeado).

### Rutas del frontend (`src/app/`)

`/` · `/flota` · `/tarifas` · `/servicios` · `/sedes` · `/empresa` · `/faqs` · `/blog` · `/blog/:slug` · `/contacto` · `/reserva` · `/legal/:slug` (aviso-legal, politica-privacidad, condiciones-alquiler, politica-cookies) · 404.

`SmartHeader`, `Footer`, `WhatsAppFab` y `CookieBanner` los monta el layout del grupo `(web)`.

### API (`src/app/api/`)

Público: `GET /api/catalog`, `GET /api/offices`, `GET /api/vehicles`, `GET /api/reservations/offers`, `POST /api/reservations/checkout`, `GET /api/reservations/code/:code`, `POST /api/contact`.
Admin (cookie de sesión): `POST /api/admin/login` · `POST /api/admin/logout` · `GET /api/admin/session` · `GET /api/admin/stats` · `GET|PATCH /api/admin/reservations[/:id[/status]]` · `GET /api/admin/reservations/:id/assignable-vehicles` · `GET|PATCH /api/admin/vehicles[/:id]` · `GET /api/admin/clients` · `GET /api/admin/email-logs`.

### Styling

CSS Modules por página/componente. Tokens en `src/styles/globals.css`: `--coal` (#F9F9F9 fondo claro), `--chalk` (#012369 azul marino), `--accent` (#AFE23A verde), `--font-display` (Bebas Neue, titulares en mayúsculas), `--font-body` (Inter). Todo el texto visible va en español **con tildes**.

### Env

`.env` (raíz) está en `.gitignore` (contuvo credenciales; fueron expuestas en el historial de git — rotar si no se ha hecho). Plantilla en `.env.example`; lo leen tanto Next como el CLI de Prisma. Variables de email: `BREVO_API_KEY`, `SMTP_FROM` (remitente verificado en Brevo), `NOTIFY_EMAIL`.

### Datos pendientes de confirmar con el cliente

- Teléfono directo de la oficina de Tudela (se usa el central 976 106 100).
- Coordenadas exactas de las oficinas (aproximadas desde la dirección postal).
- CIF y domicilio social de Alcotrans, S.L. para el aviso legal (marcado «[dato pendiente de confirmación]» en `src/data/legalContent.ts`).

### Despliegue

Un único proyecto en Vercel. Variables necesarias: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `BREVO_API_KEY`, `SMTP_FROM`, `NOTIFY_EMAIL`. Las migraciones se aplican con `npm run db:migrate:deploy` (localmente o en el Build Command).
