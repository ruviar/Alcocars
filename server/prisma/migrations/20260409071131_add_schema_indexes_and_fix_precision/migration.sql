-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "extraKmRate" SET DATA TYPE DECIMAL(6,3);

-- CreateIndex
CREATE INDEX "reservation_extras_reservationId_idx" ON "reservation_extras"("reservationId");

-- CreateIndex
CREATE INDEX "reservations_clientId_idx" ON "reservations"("clientId");

-- CreateIndex
CREATE INDEX "reservations_officeId_idx" ON "reservations"("officeId");
