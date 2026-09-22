-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "appreciationRateOverride" DOUBLE PRECISION,
ADD COLUMN     "areaSqm" DOUBLE PRECISION,
ADD COLUMN     "rentGrowthRateOverride" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Comparable" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION,
    "monthlyRent" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "observedDate" TIMESTAMP(3),
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comparable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comparable_propertyId_idx" ON "Comparable"("propertyId");

-- AddForeignKey
ALTER TABLE "Comparable" ADD CONSTRAINT "Comparable_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
