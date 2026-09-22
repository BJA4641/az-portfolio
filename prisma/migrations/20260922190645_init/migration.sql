-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('OWNED', 'FOR_SALE', 'SOLD');

-- CreateEnum
CREATE TYPE "LeaseFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'LATE', 'MISSED');

-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL DEFAULT 'HOUSE',
    "status" "PropertyStatus" NOT NULL DEFAULT 'OWNED',
    "purchasePrice" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "currentValue" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantContact" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "frequency" "LeaseFrequency" NOT NULL DEFAULT 'MONTHLY',
    "status" "LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "depositAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentPayment" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tax" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "TaxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "buyerName" TEXT NOT NULL,
    "buyerContact" TEXT,
    "brokerId" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceVisit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "vendorName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "salary" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "hireDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agencyName" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "defaultCommissionRate" DOUBLE PRECISION,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Broker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "saleId" TEXT,
    "leaseId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "rate" DOUBLE PRECISION,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" "FeeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Property_country_idx" ON "Property"("country");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Lease_propertyId_idx" ON "Lease"("propertyId");

-- CreateIndex
CREATE INDEX "Lease_status_idx" ON "Lease"("status");

-- CreateIndex
CREATE INDEX "RentPayment_leaseId_idx" ON "RentPayment"("leaseId");

-- CreateIndex
CREATE INDEX "RentPayment_status_idx" ON "RentPayment"("status");

-- CreateIndex
CREATE INDEX "Tax_propertyId_idx" ON "Tax"("propertyId");

-- CreateIndex
CREATE INDEX "Tax_status_idx" ON "Tax"("status");

-- CreateIndex
CREATE INDEX "Sale_propertyId_idx" ON "Sale"("propertyId");

-- CreateIndex
CREATE INDEX "Sale_brokerId_idx" ON "Sale"("brokerId");

-- CreateIndex
CREATE INDEX "MaintenanceVisit_propertyId_idx" ON "MaintenanceVisit"("propertyId");

-- CreateIndex
CREATE INDEX "MaintenanceVisit_status_idx" ON "MaintenanceVisit"("status");

-- CreateIndex
CREATE INDEX "Commission_brokerId_idx" ON "Commission"("brokerId");

-- CreateIndex
CREATE INDEX "Commission_saleId_idx" ON "Commission"("saleId");

-- CreateIndex
CREATE INDEX "Commission_leaseId_idx" ON "Commission"("leaseId");

-- CreateIndex
CREATE INDEX "Fee_propertyId_idx" ON "Fee"("propertyId");

-- CreateIndex
CREATE INDEX "Fee_status_idx" ON "Fee"("status");

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tax" ADD CONSTRAINT "Tax_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceVisit" ADD CONSTRAINT "MaintenanceVisit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
