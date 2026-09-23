-- AlterEnum
ALTER TYPE "MaintenanceStatus" ADD VALUE 'REQUESTED';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'TENANT';

-- AlterTable
ALTER TABLE "MaintenanceVisit" ADD COLUMN     "vendorId" TEXT,
ALTER COLUMN "vendorName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "askingRent" DOUBLE PRECISION,
ADD COLUMN     "isListed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listingDescription" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "leaseId" TEXT;

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "taxId" TEXT,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceVisit_vendorId_idx" ON "MaintenanceVisit"("vendorId");

-- CreateIndex
CREATE INDEX "User_leaseId_idx" ON "User"("leaseId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceVisit" ADD CONSTRAINT "MaintenanceVisit_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
