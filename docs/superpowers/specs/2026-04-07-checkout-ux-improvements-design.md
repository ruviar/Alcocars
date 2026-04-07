# Checkout UX Improvements — Design Spec

**Date:** 2026-04-07  
**Scope:** `CheckoutPage.tsx`, `CheckoutPage.module.css`, `useVehicles.ts`, backend contract docs

---

## Overview

Three focused improvements to the `/reserva` checkout flow:

1. Make the trip summary (location, dates, category) editable inline, so users can refine their search without going back to Home.
2. Add a vehicle details modal so users can inspect specs before selecting.
3. Replace the baby seat checkbox with a quantity counter bounded by the selected vehicle's seat count.

No new backend is created in this repo. The spec includes the backend contract (Prisma schema change + service logic) that must be applied to the external API.

---

## Feature 1 — Editable Search Parameters

### State

Lift the three router-state values into local `useState`, initialised from `bookingState`:

```ts
const [editLocation, setEditLocation] = useState(bookingState?.location ?? 'Zaragoza');
const [editDateRange, setEditDateRange] = useState<DateRange | undefined>(bookingState?.dateRange);
const [editVehicleType, setEditVehicleType] = useState(bookingState?.vehicleType ?? 'Cualquier tipo');
```

These replace the current `pickupLocation`, `selectedDateRange`, `selectedVehicleType` reads.

### Reactivity

`vehicleParams` is already a derived memo. Pointing it at the new state variables is enough — `useVehicles` re-runs automatically.

When any search param changes, reset `selectedVehicleId` to `null` so the auto-select effect picks the first result of the new list.

### UI

The `summaryCard` article becomes an editable block. Each row shows:
- **Sede** — same custom dropdown pattern as BookingEngine (button trigger + `<ul>` popover). Options: `['Zaragoza', 'Tudela', 'Soria']`.
- **Fechas** — same date range button + DayPicker popover pattern as BookingEngine.
- **Categoría** — same custom dropdown. Options: `['Cualquier tipo', 'Turismos', 'Furgonetas', '4×4', 'Autocaravanas']`.

Both dropdowns manage their open state via a local `openSummaryDropdown: 'location' | 'category' | null` state. The date popover has its own `isSummaryDateOpen: boolean`. Outside-click and Escape handlers mirror BookingEngine's.

The visual label row (`summaryLabel`) stays. The static `summaryValue` text is replaced by the control. No "Apply" button — changes are immediate and live.

### Behaviour

- Changing location or category triggers an immediate `useVehicles` recalculation.
- Changing dates: the DayPicker selects the full range; only when `dateRange.from && dateRange.to` are both set does `vehicleParams` update (same guard already in place for `endDateStr`).
- `formattedDates` memo points to `editDateRange`.

---

## Feature 2 — Vehicle Details Modal

### Data

Add `power` and `highlight` to `ApiVehicle` in `useVehicles.ts` and map them from the static vehicle data:

```ts
export type ApiVehicle = {
  // ...existing fields...
  power: string;      // e.g. "150 CV"
  highlight: string;  // e.g. "Pick-up trabajo / Todoterreno"
};
```

In the mapping inside `useVehicles`:
```ts
power: v.power,
highlight: v.highlight,
```

### State

```ts
const [modalVehicle, setModalVehicle] = useState<ApiVehicle | null>(null);
const dialogRef = useRef<HTMLDialogElement>(null);
```

Opening: `setModalVehicle(v)` + `dialogRef.current?.showModal()`.  
Closing: `dialogRef.current?.close()` + `setModalVehicle(null)` (on `dialog.close` event and backdrop click).

Backdrop click detection: compare `event.target === dialogRef.current` (clicking the `<dialog>` backdrop).

### UI — Vehicle Card

Each `vehicleItem` label gains a "Ver detalles" `<button>` (type="button") to its right, before the price. Clicking it calls `openModal(v)` and stops event propagation so it doesn't also select the radio.

```
[ ● ] Seat León  [Ver detalles]  €45/día
```

### UI — Modal

A `<dialog ref={dialogRef}>` rendered at the bottom of the component. Styles in `CheckoutPage.module.css`:

- `.vehicleModal` — glassmorphism: `background: var(--glass-strong)`, `backdrop-filter: blur(24px)`, border, border-radius `var(--radius-md)`. Max-width 560px. Native `::backdrop` with semi-transparent dark overlay.
- `.vehicleModalImage` — full-width image, `object-fit: cover`, max-height 220px, border-radius top.
- `.vehicleModalBody` — padding, grid layout.
- `.vehicleModalSpecs` — 2-column grid of spec pills (label + value).
- `.vehicleModalClose` — absolute top-right close button.

Content sections:
1. Large image (`imageUrl`)
2. Brand + Model heading
3. Highlight badge
4. Specs grid: Potencia · Plazas · Combustible · Transmisión
5. Description (highlight as paragraph if distinct, otherwise omit)
6. "Seleccionar este vehículo" button that also closes the modal and sets `selectedVehicleId`.

---

## Feature 3 — Baby Seat Quantity Counter

### State

```ts
const [babySeatQty, setBabySeatQty] = useState(0);
```

`extras` remains `Record<'snowChains' | 'additionalDriver', boolean>` (babySeat removed from it).

### Max constraint

```ts
const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId) ?? null;
const maxBabySeats = selectedVehicle ? selectedVehicle.seats - 1 : 0;
```

Reset `babySeatQty` to 0 when `selectedVehicleId` changes (if the new vehicle has fewer seats).

### UI

Separate render from the toggle loop. The `EXTRAS_CONFIG` array drops `babySeat`. Baby seat rendered first, standalone:

```
Silla de bebé        [−]  2  [+]
                          (deshabilitado si !selectedVehicle)
```

`−` disabled when `babySeatQty === 0`. `+` disabled when `babySeatQty === maxBabySeats`. Both buttons disabled when `!selectedVehicle`.

Add a small hint: `"Máx. {maxBabySeats} (plazas disponibles)"` visible when a vehicle is selected.

### Submit payload

```ts
const extrasPayload = [
  ...(babySeatQty > 0 ? [{ key: 'BABY_SEAT', quantity: babySeatQty }] : []),
  ...(extras.snowChains ? [{ key: 'SNOW_CHAINS', quantity: 1 }] : []),
  ...(extras.additionalDriver ? [{ key: 'ADDITIONAL_DRIVER', quantity: 1 }] : []),
];
```

---

## Backend Contract (apply to external API)

### Prisma schema change

In the `ReservationExtra` model, add:

```prisma
model ReservationExtra {
  id             String      @id @default(cuid())
  reservationId  String
  reservation    Reservation @relation(fields: [reservationId], references: [id])
  extraType      ExtraType
  quantity       Int         @default(1)   // ← ADD THIS
  unitPrice      Decimal     @db.Decimal(10, 2)
  // ...other existing fields
}
```

Migration command:
```bash
npx prisma migrate dev --name add_extra_quantity
```

### reservations.service.ts — price calculation

```ts
// In the checkout method, when computing extra costs:
for (const extra of dto.extras) {
  const unitPrice = EXTRA_PRICES[extra.key];          // existing lookup
  const totalDays = differenceInDays(endDate, startDate) || 1;
  totalPrice += unitPrice * extra.quantity * totalDays; // ← multiply by quantity
  
  await prisma.reservationExtra.create({
    data: {
      reservationId: reservation.id,
      extraType: extra.key,
      quantity: extra.quantity,                        // ← persist quantity
      unitPrice,
    },
  });
}
```

### DTO / validation (e.g. class-validator or zod)

```ts
// ExtraItemDto
{ key: 'BABY_SEAT' | 'SNOW_CHAINS' | 'ADDITIONAL_DRIVER'; quantity: number /* min: 1 */ }

// CheckoutDto — extras field changes from:
extras: ExtraType[]
// to:
extras: ExtraItemDto[]
```

---

## Files Changed

| File | Change |
|---|---|
| `src/hooks/useVehicles.ts` | Add `power`, `highlight` to `ApiVehicle`; map from static data |
| `src/pages/CheckoutPage.tsx` | All three features; new state, controls, modal, counter |
| `src/pages/CheckoutPage.module.css` | Modal styles, counter styles, editable summary row styles |

No new files created. No shared components extracted.
