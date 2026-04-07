# Checkout UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir parámetros de búsqueda editables, modal de detalles de vehículo, y selector de cantidad para silla de bebé en CheckoutPage.

**Architecture:** Estado local inicializado desde router state sustituye a los valores estáticos; `useVehicles` ya es reactivo. El modal usa `<dialog>` nativo. El contador de sillas de bebé es estado independiente con cota derivada del vehículo seleccionado.

**Tech Stack:** React 19, TypeScript, CSS Modules, react-day-picker, date-fns, GSAP (ya en uso), sin dependencias nuevas.

---

## File Map

| File | Action |
|---|---|
| `src/hooks/useVehicles.ts` | Modify — añadir `power` y `highlight` a `ApiVehicle` |
| `src/pages/CheckoutPage.tsx` | Modify — las tres features |
| `src/pages/CheckoutPage.module.css` | Modify — estilos para controles editables, modal y contador |

---

## Task 1: Extender ApiVehicle con `power` y `highlight`

**Files:**
- Modify: `src/hooks/useVehicles.ts`

- [ ] **Step 1: Añadir los campos al tipo y al mapeo**

Reemplaza el contenido completo de `src/hooks/useVehicles.ts` con:

```ts
import { useMemo } from 'react';
import { vehicles as staticVehicles } from '../data/vehicles';

export type ApiVehicle = {
  id: string;
  model: string;
  brand: string;
  category: string;
  seats: number;
  dailyRate: string;
  imageUrl: string;
  fuelType: string;
  transmissionType: string;
  power: string;
  highlight: string;
  office: { slug: string; city: string };
};

type Params = {
  officeSlug: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  category?: string;
};

const API_TO_STATIC_CATEGORY: Record<string, string> = {
  TURISMOS: 'Turismos',
  FURGONETAS: 'Furgonetas',
  SUV_4X4: '4x4',
  AUTOCARAVANAS: 'Autocaravanas',
};

export function useVehicles(params: Params | null) {
  const vehicles = useMemo(() => {
    if (!params) return null;

    const staticCategory = params.category
      ? API_TO_STATIC_CATEGORY[params.category]
      : null;

    const filtered = staticCategory
      ? staticVehicles.filter((v) => v.category === staticCategory)
      : staticVehicles;

    return filtered.map((v) => ({
      id: v.id,
      model: v.name,
      brand: v.brand,
      category: v.category,
      seats: v.seats,
      dailyRate: String(v.dailyRate),
      imageUrl: v.image,
      fuelType: v.fuel,
      transmissionType: v.transmission,
      power: v.power,
      highlight: v.highlight,
      office: { slug: params.officeSlug, city: params.officeSlug },
    })) as ApiVehicle[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.officeSlug, params?.startDate, params?.endDate, params?.category]);

  return { vehicles, loading: false, error: null };
}
```

- [ ] **Step 2: Verificar que el build no tiene errores de tipos**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && npm run build 2>&1 | head -30
```

Esperado: sin errores TS.

- [ ] **Step 3: Commit**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && git add src/hooks/useVehicles.ts && git commit -m "feat: add power and highlight fields to ApiVehicle"
```

---

## Task 2: Añadir CSS para los tres features

**Files:**
- Modify: `src/pages/CheckoutPage.module.css`

- [ ] **Step 1: Añadir al final de `CheckoutPage.module.css` los estilos de controles editables del resumen, DayPicker, modal y contador**

Añade al final del archivo:

```css
/* ─── SUMMARY EDITABLE CONTROLS ───────────────────── */

.summaryControl {
  position: relative;
}

.summarySelectTrigger,
.summaryDateTrigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  width: 100%;
  font-family: var(--font-body);
  font-size: clamp(18px, 2.2vw, 28px);
  font-weight: 700;
  line-height: 1.1;
  color: var(--chalk);
  cursor: pointer;
  text-align: left;
}

.summarySelectTrigger:focus-visible,
.summaryDateTrigger:focus-visible {
  outline: none;
  color: var(--accent-dim);
}

.summaryChevron {
  width: 16px;
  height: 16px;
  opacity: 0.5;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.summaryChevronOpen {
  transform: rotate(180deg);
}

.summaryDropdownMenu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 160px;
  background: var(--obsidian);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px;
  list-style: none;
  z-index: 40;
  box-shadow: 0 12px 32px rgba(1, 35, 105, 0.14);
  animation: summaryDropDown 0.18s ease-out forwards;
}

.summaryDropdownItem {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  font-family: var(--font-body);
  padding: 10px 14px;
  font-size: 14px;
  color: var(--chalk);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.summaryDropdownItem:hover,
.summaryDropdownItemActive {
  background: rgba(175, 226, 58, 0.22);
}

.summaryDatePopover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: min(340px, 90vw);
  background: var(--obsidian);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  z-index: 40;
  box-shadow: 0 18px 46px rgba(1, 35, 105, 0.15);
  animation: summaryDropDown 0.18s ease-out forwards;
}

@keyframes summaryDropDown {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── DAY PICKER (dentro de CheckoutPage) ──────────── */

.rdpRoot {
  color: var(--chalk);
}

.rdpMonths {
  display: flex;
  gap: 16px;
}

.rdpMonth {
  min-width: 270px;
}

.rdpMonthCaption {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  min-height: 30px;
}

.rdpCaptionLabel {
  font-size: 14px;
  font-weight: 700;
  color: var(--chalk);
  letter-spacing: 0.2px;
  text-transform: capitalize;
}

.rdpNav {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.rdpNavButton {
  pointer-events: auto;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--graphite);
  color: var(--chalk);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.rdpNavButton:hover {
  border-color: var(--accent);
  background: rgba(175, 226, 58, 0.24);
}

.rdpChevron {
  width: 14px;
  height: 14px;
}

.rdpMonthGrid {
  width: 100%;
  border-collapse: collapse;
}

.rdpWeekday {
  font-size: 11px;
  font-weight: 600;
  color: var(--silver);
  text-transform: uppercase;
  text-align: center;
  padding: 0 0 8px;
}

.rdpDay {
  padding: 0;
  text-align: center;
}

.rdpDayButton {
  width: 36px;
  height: 36px;
  margin: 0 auto;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--chalk);
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.rdpDayButton:hover {
  background: rgba(175, 226, 58, 0.2);
}

.rdpDayToday .rdpDayButton {
  box-shadow: inset 0 0 0 1px rgba(143, 190, 47, 0.62);
}

.rdpDayOutside .rdpDayButton {
  color: rgba(94, 104, 121, 0.45);
}

.rdpDayDisabled .rdpDayButton {
  color: rgba(94, 104, 121, 0.32);
  cursor: not-allowed;
}

.rdpDayDisabled .rdpDayButton:hover {
  background: transparent;
}

.rdpDaySelected .rdpDayButton {
  background: var(--accent);
  color: var(--chalk);
  font-weight: 700;
}

.rdpRangeMiddle .rdpDayButton {
  background: rgba(175, 226, 58, 0.35);
  border-radius: 0;
}

.rdpRangeStart .rdpDayButton,
.rdpRangeEnd .rdpDayButton {
  background: var(--accent);
  color: var(--chalk);
  font-weight: 700;
  border-radius: 0;
}

.rdpRangeStart .rdpDayButton {
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.rdpRangeEnd .rdpDayButton {
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

/* ─── VEHICLE CARD RESTRUCTURE ─────────────────────── */

.vehicleSelectLabel {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  cursor: pointer;
}

.vehicleDetailsBtn {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-dim);
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast);
}

.vehicleDetailsBtn:hover {
  background: rgba(143, 190, 47, 0.15);
}

/* ─── VEHICLE MODAL ────────────────────────────────── */

.vehicleModal {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(540px, 92vw);
  max-height: min(640px, 90vh);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--glass-strong);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  padding: 0;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(1, 35, 105, 0.22);
  z-index: var(--z-modal);
}

.vehicleModal::backdrop {
  background: rgba(1, 35, 105, 0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.vehicleModalImage {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.vehicleModalBody {
  padding: clamp(18px, 3vw, 28px);
  display: grid;
  gap: 18px;
  overflow-y: auto;
  max-height: calc(min(640px, 90vh) - 200px);
}

.vehicleModalHeader {
  display: grid;
  gap: 6px;
}

.vehicleModalTitle {
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 700;
  color: var(--chalk);
  line-height: 1.1;
}

.vehicleModalBadge {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-dim);
  letter-spacing: 0.3px;
}

.vehicleModalSpecs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  list-style: none;
}

.vehicleModalSpecItem {
  background: var(--graphite);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: grid;
  gap: 3px;
}

.vehicleModalSpecLabel {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--silver);
}

.vehicleModalSpecValue {
  font-size: 15px;
  font-weight: 700;
  color: var(--chalk);
}

.vehicleModalClose {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(249, 249, 249, 0.88);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  cursor: pointer;
  color: var(--chalk);
  z-index: 2;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.vehicleModalClose:hover {
  background: var(--chalk);
  color: var(--obsidian);
  border-color: var(--chalk);
}

.vehicleModalSelectBtn {
  width: 100%;
  padding: 14px 20px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--accent);
  color: var(--chalk);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.vehicleModalSelectBtn:hover {
  background: var(--chalk);
  color: var(--obsidian);
  transform: translateY(-1px);
}

/* ─── BABY SEAT COUNTER ────────────────────────────── */

.babySeatLeft {
  display: grid;
  gap: 3px;
}

.babySeatHint {
  font-size: 11px;
  color: var(--silver);
  letter-spacing: 0.2px;
}

.babySeatCounter {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.babySeatBtn {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--chalk);
  font-size: 16px;
  font-weight: 700;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
  line-height: 1;
  padding: 0;
}

.babySeatBtn:hover:not(:disabled) {
  border-color: var(--accent-dim);
  background: rgba(175, 226, 58, 0.18);
}

.babySeatBtn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.babySeatQtyNum {
  min-width: 22px;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--chalk);
  font-family: var(--font-mono);
}
```

- [ ] **Step 2: Modificar `.vehicleItem` para que funcione como `div` en lugar de `label`**

Localiza en `CheckoutPage.module.css` el bloque `.vehicleItem` (líneas 367-376) y reemplaza `cursor: pointer` por `cursor: default`:

```css
.vehicleItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  border-radius: 6px;
  cursor: default;
  transition: background var(--transition-fast);
}
```

- [ ] **Step 3: Verificar build sin errores CSS**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && npm run build 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && git add src/pages/CheckoutPage.module.css && git commit -m "style: add editable summary, modal, and baby seat counter CSS"
```

---

## Task 3: Feature 1 — Parámetros de búsqueda editables

**Files:**
- Modify: `src/pages/CheckoutPage.tsx`

- [ ] **Step 1: Actualizar imports**

Reemplaza el bloque de imports al inicio del archivo por:

```tsx
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { startOfToday } from 'date-fns';
import { gsap } from 'gsap';
import { DayPicker, type ClassNames, type DateRange } from 'react-day-picker';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useVehicles } from '../hooks/useVehicles';
import styles from './CheckoutPage.module.css';
```

- [ ] **Step 2: Actualizar los tipos y constantes al inicio del componente**

El tipo `ExtraKey` queda igual por ahora (se modifica en Task 5). No tocar `EXTRAS_CONFIG`, `EXTRAS_API_MAP`, `initialExtrasState` todavía.

Añade la constante de opciones de búsqueda justo después de `CATEGORY_MAP`:

```tsx
const LOCATIONS = ['Zaragoza', 'Tudela', 'Soria'] as const;
const VEHICLE_TYPES = ['Cualquier tipo', 'Turismos', 'Furgonetas', '4×4', 'Autocaravanas'] as const;
```

- [ ] **Step 3: Añadir estado editable y reemplazar los valores derivados del router state**

Dentro de `CheckoutPage()`, reemplaza las líneas 86-103 (desde `const bookingState` hasta `const vehicleParams`) por:

```tsx
const bookingState = state as CheckoutState | null;

const hasSearchState = Boolean(
  bookingState?.location && bookingState?.vehicleType && bookingState?.dateRange?.from,
);

// Editable search params — initialised from router state
const [editLocation, setEditLocation] = useState<string>(bookingState?.location ?? 'Zaragoza');
const [editDateRange, setEditDateRange] = useState<DateRange | undefined>(bookingState?.dateRange);
const [editVehicleType, setEditVehicleType] = useState<string>(bookingState?.vehicleType ?? 'Cualquier tipo');
const [openSummaryDropdown, setOpenSummaryDropdown] = useState<'location' | 'category' | null>(null);
const [isSummaryDateOpen, setIsSummaryDateOpen] = useState(false);

const officeSlug = editLocation.toLowerCase();
const apiCategory = editVehicleType !== 'Cualquier tipo' ? CATEGORY_MAP[editVehicleType] : undefined;
const startDateStr = editDateRange?.from ? format(editDateRange.from, 'yyyy-MM-dd') : '';
const endDateStr = editDateRange?.to ? format(editDateRange.to, 'yyyy-MM-dd') : startDateStr;

const vehicleParams = hasSearchState && startDateStr
  ? { officeSlug, startDate: startDateStr, endDate: endDateStr, category: apiCategory }
  : null;
```

- [ ] **Step 4: Actualizar `formattedDates` para apuntar a `editDateRange`**

Reemplaza la línea `const formattedDates = useMemo(...)` (actualmente línea 114-117) por:

```tsx
const formattedDates = useMemo(() => formatDateRangeLabel(editDateRange), [editDateRange]);
```

- [ ] **Step 5: Añadir los handlers para los controles editables y el useEffect de outside-click**

Añade justo antes de `handleInputChange`:

```tsx
const handleEditLocation = (loc: string) => {
  setEditLocation(loc);
  setSelectedVehicleId(null);
  setOpenSummaryDropdown(null);
};

const handleEditVehicleType = (type: string) => {
  setEditVehicleType(type);
  setSelectedVehicleId(null);
  setOpenSummaryDropdown(null);
};

const handleEditDateRange = (range: DateRange | undefined) => {
  setEditDateRange(range);
  if (range?.from && range?.to) {
    setSelectedVehicleId(null);
    setIsSummaryDateOpen(false);
  }
};

const toggleSummaryDropdown = (key: 'location' | 'category') => {
  setIsSummaryDateOpen(false);
  setOpenSummaryDropdown((prev) => (prev === key ? null : key));
};

const toggleSummaryDate = () => {
  setOpenSummaryDropdown(null);
  setIsSummaryDateOpen((prev) => !prev);
};
```

Añade un `useEffect` de outside-click para los controles del resumen (después del `useEffect` de GSAP):

```tsx
useEffect(() => {
  if (!isSummaryDateOpen && !openSummaryDropdown) return;

  const handleOutside = (e: MouseEvent) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('[data-summary-select]') || e.target.closest('[data-summary-date]')) return;
    setOpenSummaryDropdown(null);
    setIsSummaryDateOpen(false);
  };
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpenSummaryDropdown(null);
      setIsSummaryDateOpen(false);
    }
  };
  document.addEventListener('mousedown', handleOutside);
  document.addEventListener('keydown', handleEsc);
  return () => {
    document.removeEventListener('mousedown', handleOutside);
    document.removeEventListener('keydown', handleEsc);
  };
}, [isSummaryDateOpen, openSummaryDropdown]);
```

- [ ] **Step 6: Añadir `dayPickerClassNames` para el DayPicker del resumen**

Añade esta constante justo antes del `return` principal (después de todos los `useEffect` y handlers):

```tsx
const summaryDayPickerClassNames: Partial<ClassNames> = {
  root: styles.rdpRoot,
  months: styles.rdpMonths,
  month: styles.rdpMonth,
  month_caption: styles.rdpMonthCaption,
  caption_label: styles.rdpCaptionLabel,
  nav: styles.rdpNav,
  button_previous: styles.rdpNavButton,
  button_next: styles.rdpNavButton,
  chevron: styles.rdpChevron,
  month_grid: styles.rdpMonthGrid,
  weekdays: styles.rdpWeekdays,
  weekday: styles.rdpWeekday,
  weeks: styles.rdpWeeks,
  week: styles.rdpWeek,
  day: styles.rdpDay,
  day_button: styles.rdpDayButton,
  disabled: styles.rdpDayDisabled,
  outside: styles.rdpDayOutside,
  today: styles.rdpDayToday,
  selected: styles.rdpDaySelected,
  range_start: styles.rdpRangeStart,
  range_middle: styles.rdpRangeMiddle,
  range_end: styles.rdpRangeEnd,
};
```

- [ ] **Step 7: Reemplazar el `summaryCard` estático por el bloque editable**

Localiza el `<article className={styles.summaryCard}>` (actualmente muestra 3 rows estáticos de Fechas, Recogida, Categoría) y reemplázalo por:

```tsx
<article className={styles.summaryCard}>
  {/* Fechas */}
  <div className={styles.summaryRow}>
    <span className={styles.summaryLabel}>Fechas</span>
    <div className={styles.summaryControl} data-summary-date>
      <button
        type="button"
        className={styles.summaryDateTrigger}
        aria-expanded={isSummaryDateOpen}
        onClick={toggleSummaryDate}
      >
        <span>{formattedDates}</span>
        <svg
          className={`${styles.summaryChevron} ${isSummaryDateOpen ? styles.summaryChevronOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isSummaryDateOpen && (
        <div className={styles.summaryDatePopover} role="dialog" aria-label="Seleccionar fechas">
          <DayPicker
            mode="range"
            locale={es}
            weekStartsOn={1}
            numberOfMonths={1}
            pagedNavigation
            showOutsideDays
            fixedWeeks
            selected={editDateRange}
            onSelect={handleEditDateRange}
            disabled={{ before: startOfToday() }}
            defaultMonth={editDateRange?.from ?? startOfToday()}
            classNames={summaryDayPickerClassNames}
          />
        </div>
      )}
    </div>
  </div>

  {/* Recogida */}
  <div className={styles.summaryRow}>
    <span className={styles.summaryLabel}>Recogida</span>
    <div className={styles.summaryControl} data-summary-select>
      <button
        type="button"
        className={styles.summarySelectTrigger}
        aria-expanded={openSummaryDropdown === 'location'}
        onClick={() => toggleSummaryDropdown('location')}
      >
        <span>{editLocation}</span>
        <svg
          className={`${styles.summaryChevron} ${openSummaryDropdown === 'location' ? styles.summaryChevronOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {openSummaryDropdown === 'location' && (
        <ul className={styles.summaryDropdownMenu} role="listbox" aria-label="Ciudades de recogida">
          {LOCATIONS.map((city) => (
            <li key={city}>
              <button
                type="button"
                role="option"
                aria-selected={editLocation === city}
                className={`${styles.summaryDropdownItem} ${editLocation === city ? styles.summaryDropdownItemActive : ''}`}
                onClick={() => handleEditLocation(city)}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>

  {/* Categoría */}
  <div className={styles.summaryRow}>
    <span className={styles.summaryLabel}>Categoría</span>
    <div className={styles.summaryControl} data-summary-select>
      <button
        type="button"
        className={styles.summarySelectTrigger}
        aria-expanded={openSummaryDropdown === 'category'}
        onClick={() => toggleSummaryDropdown('category')}
      >
        <span>{editVehicleType}</span>
        <svg
          className={`${styles.summaryChevron} ${openSummaryDropdown === 'category' ? styles.summaryChevronOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {openSummaryDropdown === 'category' && (
        <ul className={styles.summaryDropdownMenu} role="listbox" aria-label="Categorías de vehículo">
          {VEHICLE_TYPES.map((type) => (
            <li key={type}>
              <button
                type="button"
                role="option"
                aria-selected={editVehicleType === type}
                className={`${styles.summaryDropdownItem} ${editVehicleType === type ? styles.summaryDropdownItemActive : ''}`}
                onClick={() => handleEditVehicleType(type)}
              >
                {type}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
</article>
```

- [ ] **Step 8: Verificar en el navegador**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && npm run dev
```

Navega desde la home haciendo una búsqueda. Comprueba:
- Los tres campos del resumen muestran botones con chevron
- Al cambiar sede, la lista de vehículos se recarga (mismo pool estático, pero params cambian)
- El DayPicker abre y permite seleccionar fechas
- Outside-click y Escape cierran popovers

- [ ] **Step 9: Build check**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && npm run build 2>&1 | head -30
```

- [ ] **Step 10: Commit**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && git add src/pages/CheckoutPage.tsx && git commit -m "feat: make checkout summary params editable with live vehicle refresh"
```

---

## Task 4: Feature 2 — Modal de detalles del vehículo

**Files:**
- Modify: `src/pages/CheckoutPage.tsx`

- [ ] **Step 1: Añadir estado y ref del modal**

Después de las líneas de estado existentes (`const [confirmationCode...]`), añade:

```tsx
const [modalVehicle, setModalVehicle] = useState<import('../hooks/useVehicles').ApiVehicle | null>(null);
const dialogRef = useRef<HTMLDialogElement>(null);
```

> Nota: el tipo `ApiVehicle` ya está disponible porque `useVehicles` lo exporta. Si el import de tipo resulta repetido, importa `ApiVehicle` explícitamente en el import del hook al inicio del archivo: `import { useVehicles, type ApiVehicle } from '../hooks/useVehicles';`

- [ ] **Step 2: Añadir handlers del modal**

Añade justo antes de `handleInputChange`:

```tsx
const openModal = (vehicle: typeof modalVehicle) => {
  setModalVehicle(vehicle);
};

const closeModal = () => {
  dialogRef.current?.close();
  setModalVehicle(null);
};

const handleModalBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
  if (e.target === dialogRef.current) closeModal();
};
```

Añade un `useEffect` que llama `showModal()` cuando `modalVehicle` cambia a no-null:

```tsx
useEffect(() => {
  if (modalVehicle) {
    dialogRef.current?.showModal();
  }
}, [modalVehicle]);
```

- [ ] **Step 3: Actualizar import de ApiVehicle**

Reemplaza la línea de import del hook por:

```tsx
import { useVehicles, type ApiVehicle } from '../hooks/useVehicles';
```

Y simplifica el tipo del estado del modal:

```tsx
const [modalVehicle, setModalVehicle] = useState<ApiVehicle | null>(null);
```

Y ajusta `openModal` para que el tipo sea explícito:

```tsx
const openModal = (vehicle: ApiVehicle) => {
  setModalVehicle(vehicle);
};
```

- [ ] **Step 4: Restructurar el renderizado de cada vehicleItem (de `<label>` a `<div>`)**

Localiza el bloque `{vehicles.map((v) => (` y reemplaza el interior completo por:

```tsx
{vehicles.map((v) => (
  <div
    key={v.id}
    className={`${styles.vehicleItem} ${selectedVehicleId === v.id ? styles.vehicleItemSelected : ''}`}
  >
    <label className={styles.vehicleSelectLabel}>
      <input
        type="radio"
        name="vehicleId"
        value={v.id}
        checked={selectedVehicleId === v.id}
        onChange={() => setSelectedVehicleId(v.id)}
        className={styles.vehicleRadio}
      />
      <span className={styles.vehicleName}>{v.brand} {v.model}</span>
    </label>
    <button
      type="button"
      className={styles.vehicleDetailsBtn}
      onClick={() => openModal(v)}
    >
      Ver detalles
    </button>
    <span className={styles.vehicleRate}>€{Number(v.dailyRate).toFixed(0)}/día</span>
  </div>
))}
```

- [ ] **Step 5: Añadir el `<dialog>` del modal al JSX**

Justo antes del cierre del `return` principal (antes del último `</main>`), añade:

```tsx
<dialog
  ref={dialogRef}
  className={styles.vehicleModal}
  onClick={handleModalBackdropClick}
>
  {modalVehicle && (
    <>
      <button
        type="button"
        className={styles.vehicleModalClose}
        onClick={closeModal}
        aria-label="Cerrar detalles del vehículo"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <img
        src={modalVehicle.imageUrl}
        alt={`${modalVehicle.brand} ${modalVehicle.model}`}
        className={styles.vehicleModalImage}
      />
      <div className={styles.vehicleModalBody}>
        <div className={styles.vehicleModalHeader}>
          <h2 className={styles.vehicleModalTitle}>{modalVehicle.brand} {modalVehicle.model}</h2>
          <span className={styles.vehicleModalBadge}>{modalVehicle.highlight}</span>
        </div>
        <dl className={styles.vehicleModalSpecs}>
          <div className={styles.vehicleModalSpecItem}>
            <dt className={styles.vehicleModalSpecLabel}>Potencia</dt>
            <dd className={styles.vehicleModalSpecValue}>{modalVehicle.power}</dd>
          </div>
          <div className={styles.vehicleModalSpecItem}>
            <dt className={styles.vehicleModalSpecLabel}>Plazas</dt>
            <dd className={styles.vehicleModalSpecValue}>{modalVehicle.seats}</dd>
          </div>
          <div className={styles.vehicleModalSpecItem}>
            <dt className={styles.vehicleModalSpecLabel}>Combustible</dt>
            <dd className={styles.vehicleModalSpecValue}>{modalVehicle.fuelType}</dd>
          </div>
          <div className={styles.vehicleModalSpecItem}>
            <dt className={styles.vehicleModalSpecLabel}>Transmisión</dt>
            <dd className={styles.vehicleModalSpecValue}>{modalVehicle.transmissionType}</dd>
          </div>
          <div className={styles.vehicleModalSpecItem}>
            <dt className={styles.vehicleModalSpecLabel}>Categoría</dt>
            <dd className={styles.vehicleModalSpecValue}>{modalVehicle.category}</dd>
          </div>
          <div className={styles.vehicleModalSpecItem}>
            <dt className={styles.vehicleModalSpecLabel}>Tarifa</dt>
            <dd className={styles.vehicleModalSpecValue}>€{Number(modalVehicle.dailyRate).toFixed(0)}/día</dd>
          </div>
        </dl>
        <button
          type="button"
          className={styles.vehicleModalSelectBtn}
          onClick={() => {
            setSelectedVehicleId(modalVehicle.id);
            closeModal();
          }}
        >
          Seleccionar este vehículo
        </button>
      </div>
    </>
  )}
</dialog>
```

- [ ] **Step 6: Verificar en el navegador**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && npm run dev
```

Comprueba:
- Cada fila de vehículo muestra el botón "Ver detalles"
- Al hacer clic abre el modal con imagen, specs y botón de selección
- Escape y click en el backdrop cierran el modal
- "Seleccionar este vehículo" selecciona el radio y cierra el modal

- [ ] **Step 7: Build check y commit**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && npm run build 2>&1 | head -30
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && git add src/pages/CheckoutPage.tsx && git commit -m "feat: add vehicle details modal with glassmorphism and specs grid"
```

---

## Task 5: Feature 3 — Selector de cantidad para silla de bebé

**Files:**
- Modify: `src/pages/CheckoutPage.tsx`

- [ ] **Step 1: Actualizar `ExtraKey`, `EXTRAS_CONFIG`, `EXTRAS_API_MAP` e `initialExtrasState`**

Localiza y reemplaza las definiciones al inicio del componente (antes del componente) por:

```tsx
type ExtraKey = 'snowChains' | 'additionalDriver';

const EXTRAS_CONFIG: Array<{ key: ExtraKey; label: string }> = [
  { key: 'snowChains', label: 'Cadenas de nieve' },
  { key: 'additionalDriver', label: 'Conductor adicional' },
];

const EXTRAS_API_MAP: Record<ExtraKey, 'SNOW_CHAINS' | 'ADDITIONAL_DRIVER'> = {
  snowChains: 'SNOW_CHAINS',
  additionalDriver: 'ADDITIONAL_DRIVER',
};

const initialExtrasState: Record<ExtraKey, boolean> = {
  snowChains: false,
  additionalDriver: false,
};
```

- [ ] **Step 2: Añadir estado `babySeatQty` y las derivaciones del vehículo seleccionado**

Después de `const [confirmationCode, setConfirmationCode] = useState(...)`, añade:

```tsx
const [babySeatQty, setBabySeatQty] = useState(0);
```

Después de `const vehicleParams = ...`, añade las derivaciones:

```tsx
const selectedVehicle = vehicles?.find((v) => v.id === selectedVehicleId) ?? null;
const maxBabySeats = selectedVehicle ? selectedVehicle.seats - 1 : 0;
```

- [ ] **Step 3: Añadir effect para clamp al cambiar vehículo**

Después del effect de auto-select del primer vehículo, añade:

```tsx
useEffect(() => {
  setBabySeatQty((prev) => Math.min(prev, maxBabySeats));
}, [maxBabySeats]);
```

- [ ] **Step 4: Actualizar el payload de extras en `handleSubmit`**

Localiza dentro de `handleSubmit` el bloque que construye `selectedExtras` y reemplázalo por:

```tsx
const extrasPayload = [
  ...(babySeatQty > 0 ? [{ key: 'BABY_SEAT' as const, quantity: babySeatQty }] : []),
  ...(Object.keys(extras) as ExtraKey[])
    .filter((k) => extras[k])
    .map((k) => ({ key: EXTRAS_API_MAP[k], quantity: 1 })),
];
```

Y en la llamada a `api.post`, cambia `extras: selectedExtras` por `extras: extrasPayload`.

- [ ] **Step 5: Reemplazar el renderizado de extras para añadir el contador de sillas de bebé**

Localiza el `<article className={styles.extrasCard}>` y reemplaza su `<div className={styles.extrasList}>` completo (que actualmente itera `EXTRAS_CONFIG`) por:

```tsx
<div className={styles.extrasList}>
  {/* Baby seat — quantity counter */}
  <div className={styles.extraItem}>
    <div className={styles.babySeatLeft}>
      <span className={styles.extraLabel}>Silla de bebé</span>
      {selectedVehicle && (
        <span className={styles.babySeatHint}>
          Máx. {maxBabySeats} ({selectedVehicle.seats} plazas)
        </span>
      )}
    </div>
    <div className={styles.babySeatCounter}>
      <button
        type="button"
        className={styles.babySeatBtn}
        onClick={() => setBabySeatQty((q) => Math.max(0, q - 1))}
        disabled={!selectedVehicle || babySeatQty === 0}
        aria-label="Quitar silla de bebé"
      >
        −
      </button>
      <span className={styles.babySeatQtyNum}>{babySeatQty}</span>
      <button
        type="button"
        className={styles.babySeatBtn}
        onClick={() => setBabySeatQty((q) => Math.min(maxBabySeats, q + 1))}
        disabled={!selectedVehicle || babySeatQty >= maxBabySeats}
        aria-label="Añadir silla de bebé"
      >
        +
      </button>
    </div>
  </div>

  {/* Toggle extras */}
  {EXTRAS_CONFIG.map((extra) => (
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
```

- [ ] **Step 6: Verificar en el navegador**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && npm run dev
```

Comprueba:
- Con vehículo seleccionado: botones `−` y `+` funcionan
- `+` se deshabilita al llegar al máximo (seats - 1)
- `−` se deshabilita en 0
- Sin vehículo: ambos botones deshabilitados, sin hint de máximo
- Cambiando a un vehículo con menos plazas (ej. Berlingo 2 plazas): el qty se clampea a 0 automáticamente (maxBabySeats = 1, mínimo 0)

- [ ] **Step 7: Build final y commit**

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && npm run build 2>&1
```

Esperado: 0 errores, 0 warnings de TypeScript.

```bash
cd c:/Users/ruvia/OneDrive/Desktop/kk/Alocars && git add src/pages/CheckoutPage.tsx && git commit -m "feat: replace baby seat checkbox with quantity counter bounded by vehicle seats"
```

---

## Backend Contract (reference — aplicar en tu API externa)

### 1. Prisma schema

En el modelo `ReservationExtra`, añade el campo `quantity`:

```prisma
model ReservationExtra {
  id             String      @id @default(cuid())
  reservationId  String
  reservation    Reservation @relation(fields: [reservationId], references: [id])
  extraType      ExtraType
  quantity       Int         @default(1)   // campo nuevo
  unitPrice      Decimal     @db.Decimal(10, 2)
  createdAt      DateTime    @default(now())
}
```

Comando de migración:
```bash
npx prisma migrate dev --name add_reservation_extra_quantity
```

### 2. DTO (class-validator o zod)

```ts
// ExtraItemDto
class ExtraItemDto {
  @IsIn(['BABY_SEAT', 'SNOW_CHAINS', 'ADDITIONAL_DRIVER'])
  key: 'BABY_SEAT' | 'SNOW_CHAINS' | 'ADDITIONAL_DRIVER';

  @IsInt()
  @Min(1)
  @Max(8)
  quantity: number;
}

// En CheckoutDto:
// ANTES: extras: ExtraType[]
// DESPUÉS:
@ValidateNested({ each: true })
@Type(() => ExtraItemDto)
extras: ExtraItemDto[];
```

### 3. reservations.service.ts — cálculo de precio

```ts
// En el método checkout, reemplazar el loop de extras por:
for (const extra of dto.extras) {
  const unitPrice = EXTRA_PRICES[extra.key]; // lookup existente
  const totalDays = Math.max(1, differenceInDays(endDate, startDate));
  const lineCost = unitPrice * extra.quantity * totalDays; // multiplicar por cantidad

  totalPrice += lineCost;

  await prisma.reservationExtra.create({
    data: {
      reservationId: reservation.id,
      extraType: extra.key,
      quantity: extra.quantity,   // persistir cantidad
      unitPrice,
    },
  });
}
```
