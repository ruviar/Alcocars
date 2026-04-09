# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test framework is configured in this project.

## Architecture

**Alocars** is a car rental frontend SPA (React 19 + TypeScript + Vite). Spanish-language UI targeting the Zaragoza/Tudela/Soria region.

### Routing (`src/App.tsx`)
React Router v7 with these routes:
- `/` → Home
- `/flota` → Fleet catalog
- `/servicios` → Services
- `/sedes` → Office locations (with Leaflet map)
- `/empresa` → About
- `/blog` → Blog
- `/contacto` → Contact
- `/reserva` → Checkout (requires router `state` from BookingEngine)
- `/legal/:slug` → Legal pages (aviso-legal, politica-privacidad, condiciones-alquiler, politica-cookies)
- `*` → 404

`SmartHeader`, `Footer`, and `CookieBanner` are rendered globally; `ScrollToTop` resets scroll on navigation.

### Booking flow
1. `BookingEngine` (embedded in `HeroSection`) collects location, date range, vehicle type → navigates to `/reserva` via `useNavigate` with `state`
2. `CheckoutPage` reads that state via `useLocation`. If no state is present, it shows an empty state with a redirect to `/`.
3. The checkout form is frontend-only — submission simulates a 1.3s delay and shows a success message (no backend integration).

### Data layer (`src/data/`)
Static TypeScript files — no API calls:
- `vehicles.ts` — `Vehicle[]` with categories: `Turismos | Furgonetas | 4x4 | Autocaravanas`
- `offices.ts` — `Office[]` with coords `[lat, lng]` for Leaflet markers
- `legalContent.ts` — `LegalDocument` records keyed by slug

### Styling
CSS Modules (`.module.css` per component/page). Global design tokens and resets live in `src/styles/globals.css`. Design is dark-only with these tokens:
- Colors: `--coal` (bg), `--accent` (`#00D4FF` cyan), `--chalk` (text), `--graphite`/`--obsidian`/`--silver`
- Fonts: `Bebas Neue` (display), `Inter` (body), `Space Mono` (mono) — loaded from Google Fonts
- Custom cursor (dot + lagging ring) implemented in `App.tsx` via `requestAnimationFrame`; hidden on touch devices via `(hover: none)` media query

### Animation libraries
- **GSAP** — used in `CheckoutPage` for entry animations on mount
- **Framer Motion** — available as dependency
- **react-day-picker** — calendar in `BookingEngine` with fully custom CSS class names mapped to CSS Module classes

### Map
`LocationsMap` uses `react-leaflet` with a dark tile layer. Leaflet CSS is overridden globally in `globals.css` (`.leaflet-container`, `.leaflet-control-attribution`).
