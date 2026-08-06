-- Add quantity column for reservation extras
ALTER TABLE "reservation_extras"
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
