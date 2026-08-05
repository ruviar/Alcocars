-- Solicitudes de reserva completas: horas, sede de devolución, gama del
-- catálogo, desglose de kilometraje, extras con unidad de facturación y traza
-- de emails enviados.
--
-- Escrita a mano y pensada para poder aplicarse sobre una base con datos:
-- cada columna nueva se añade nullable, se rellena y después se marca NOT NULL.

-- ── Enums nuevos ────────────────────────────────────────────────────────────
CREATE TYPE "EmailKind" AS ENUM ('BOOKING_ADMIN', 'BOOKING_CUSTOMER', 'CONTACT_ADMIN');
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- ── reservations ────────────────────────────────────────────────────────────

-- Una solicitud web puede llegar sin unidad asignada: se guarda igual.
ALTER TABLE "reservations" ALTER COLUMN "vehicleId" DROP NOT NULL;

-- Las gamas «bajo consulta» (autocaravanas) no tienen total calculable.
ALTER TABLE "reservations" ALTER COLUMN "totalAmount" DROP NOT NULL;

ALTER TABLE "reservations"
  ADD COLUMN "returnOfficeId" TEXT,
  ADD COLUMN "pickupAt" TIMESTAMP(3),
  ADD COLUMN "returnAt" TIMESTAMP(3),
  ADD COLUMN "tariffId" TEXT,
  ADD COLUMN "tariffName" TEXT,
  ADD COLUMN "plannedKm" INTEGER,
  ADD COLUMN "includedKm" INTEGER,
  ADD COLUMN "extraKm" INTEGER,
  ADD COLUMN "extraKmRate" DECIMAL(10,4),
  ADD COLUMN "extraKmSurcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "baseTotal" DECIMAL(10,2),
  ADD COLUMN "deposit" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "franchise" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "needsAvailabilityCheck" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consentAt" TIMESTAMP(3);

-- Relleno de las reservas anteriores a esta migración: la devolución se asume
-- en la misma sede, las horas a las 10:00 y 18:00 (el horario que ofrecía el
-- wizard por defecto) y el kilometraje al mínimo incluido.
UPDATE "reservations"
SET
  "returnOfficeId" = "officeId",
  "pickupAt"       = "startDate" + TIME '10:00',
  "returnAt"       = "endDate" + TIME '18:00',
  "tariffId"       = 'legacy',
  "tariffName"     = 'Reserva anterior al catálogo de gamas',
  "plannedKm"      = "totalDays" * 200,
  "includedKm"     = "totalDays" * 200,
  "extraKm"        = 0,
  "extraKmRate"    = 0,
  "baseTotal"      = "dailyRate" * "totalDays"
WHERE "returnOfficeId" IS NULL;

ALTER TABLE "reservations"
  ALTER COLUMN "returnOfficeId" SET NOT NULL,
  ALTER COLUMN "pickupAt" SET NOT NULL,
  ALTER COLUMN "returnAt" SET NOT NULL,
  ALTER COLUMN "tariffId" SET NOT NULL,
  ALTER COLUMN "tariffName" SET NOT NULL,
  ALTER COLUMN "plannedKm" SET NOT NULL,
  ALTER COLUMN "includedKm" SET NOT NULL,
  ALTER COLUMN "extraKm" SET NOT NULL,
  ALTER COLUMN "extraKmRate" SET NOT NULL;

ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_returnOfficeId_fkey"
  FOREIGN KEY ("returnOfficeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "reservations_createdAt_idx" ON "reservations"("createdAt");

-- ── reservation_extras ──────────────────────────────────────────────────────
-- El catálogo de extras deja de ser un enum cerrado: ahora son ids del
-- catálogo publicado, con su etiqueta y unidad congeladas por histórico.

ALTER TABLE "reservation_extras" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;
ALTER TABLE "reservation_extras" RENAME COLUMN "pricePerDay" TO "unitPrice";

ALTER TABLE "reservation_extras"
  ADD COLUMN "label" TEXT,
  ADD COLUMN "unit" TEXT;

UPDATE "reservation_extras"
SET
  "label" = CASE "type"
    WHEN 'BABY_SEAT'         THEN 'Silla de bebé'
    WHEN 'SNOW_CHAINS'       THEN 'Cadenas de nieve'
    WHEN 'ADDITIONAL_DRIVER' THEN 'Conductor adicional'
    ELSE "type"
  END,
  "unit" = 'per_day'
WHERE "label" IS NULL;

-- Los ids antiguos del enum pasan a los del catálogo actual.
UPDATE "reservation_extras" SET "type" = 'babySeat'         WHERE "type" = 'BABY_SEAT';
UPDATE "reservation_extras" SET "type" = 'skiRackChains'    WHERE "type" = 'SNOW_CHAINS';
UPDATE "reservation_extras" SET "type" = 'additionalDriver' WHERE "type" = 'ADDITIONAL_DRIVER';

ALTER TABLE "reservation_extras"
  ALTER COLUMN "label" SET NOT NULL,
  ALTER COLUMN "unit" SET NOT NULL;

CREATE INDEX "reservation_extras_reservationId_idx" ON "reservation_extras"("reservationId");

DROP TYPE "ExtraType";

-- ── email_logs ──────────────────────────────────────────────────────────────
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "kind" "EmailKind" NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "providerId" TEXT,
    "error" TEXT,
    "reservationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_status_createdAt_idx" ON "email_logs"("status", "createdAt");
CREATE INDEX "email_logs_reservationId_idx" ON "email_logs"("reservationId");

ALTER TABLE "email_logs"
  ADD CONSTRAINT "email_logs_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Con vehicleId opcional, la semántica correcta al borrar una unidad es
-- conservar la reserva sin vehículo (SET NULL), no bloquear el borrado.
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_vehicleId_fkey";
ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
