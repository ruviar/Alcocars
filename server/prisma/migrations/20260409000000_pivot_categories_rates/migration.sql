-- Pivot schema: replace VehicleCategory enum + per-vehicle pricing with Category model
-- This is a destructive migration (dev/test data only)

-- 1. Drop existing foreign key constraints and indexes that reference columns being removed
ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "reservations_vehicleId_fkey";
DROP INDEX IF EXISTS "reservations_vehicleId_startDate_endDate_idx";

ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS "vehicles_category_idx";
DROP INDEX IF EXISTS "vehicles_category_idx";

-- 2. Truncate tables that depend on old columns (dev data only)
TRUNCATE TABLE "reservation_extras" CASCADE;
TRUNCATE TABLE "reservations" CASCADE;
TRUNCATE TABLE "vehicles" CASCADE;

-- 3. Create new enum
CREATE TYPE "CategoryGroup" AS ENUM ('COCHE', 'FURGONETA_TRANSPORTE', 'FURGONETA_CARGA', 'TODOTERRENO');

-- 4. Create categories table
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" "CategoryGroup" NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "price1Day" DECIMAL(10,2) NOT NULL,
    "price2Day" DECIMAL(10,2) NOT NULL,
    "price3Day" DECIMAL(10,2) NOT NULL,
    "price4Day" DECIMAL(10,2) NOT NULL,
    "price5Day" DECIMAL(10,2) NOT NULL,
    "price6Day" DECIMAL(10,2) NOT NULL,
    "price7Day" DECIMAL(10,2) NOT NULL,
    "extraKmRate" DECIMAL(5,3) NOT NULL,
    "deposit" DECIMAL(10,2) NOT NULL,
    "franchise" DECIMAL(10,2) NOT NULL,
    "powerMin" INTEGER,
    "powerMax" INTEGER,
    "seatsMin" INTEGER,
    "seatsMax" INTEGER,
    "transmissions" TEXT[],
    "fuels" TEXT[],
    "imageUrl" TEXT,
    "highlight" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- 5. Create indexes on categories
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_group_order_idx" ON "categories"("group", "order");
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");

-- 6. Alter vehicles: drop old columns, add categoryId
ALTER TABLE "vehicles" DROP COLUMN "category";
ALTER TABLE "vehicles" DROP COLUMN "dailyRate";
ALTER TABLE "vehicles" ADD COLUMN "categoryId" TEXT NOT NULL;

-- 7. Add FK and index for vehicles.categoryId
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "vehicles_categoryId_idx" ON "vehicles"("categoryId");

-- 8. Alter reservations: drop old columns, add new ones
ALTER TABLE "reservations" DROP COLUMN "vehicleId";
ALTER TABLE "reservations" DROP COLUMN "dailyRate";
ALTER TABLE "reservations" ADD COLUMN "categoryId" TEXT NOT NULL;
ALTER TABLE "reservations" ADD COLUMN "estimatedKm" INTEGER NOT NULL;
ALTER TABLE "reservations" ADD COLUMN "includedKm" INTEGER NOT NULL;
ALTER TABLE "reservations" ADD COLUMN "extraKm" INTEGER NOT NULL;
ALTER TABLE "reservations" ADD COLUMN "baseRate" DECIMAL(10,2) NOT NULL;
ALTER TABLE "reservations" ADD COLUMN "extraKmCharge" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "depositHeld" DECIMAL(10,2) NOT NULL;
ALTER TABLE "reservations" ADD COLUMN "franchiseAmount" DECIMAL(10,2) NOT NULL;

-- 9. Add FK and index for reservations.categoryId
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "reservations_categoryId_startDate_endDate_idx" ON "reservations"("categoryId", "startDate", "endDate");

-- 10. Drop old VehicleCategory enum
DROP TYPE "VehicleCategory";
