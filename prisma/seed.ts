import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const ownerEmail = (process.env.SEED_OWNER_EMAIL ?? "owner@example.com").toLowerCase();
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "change-me-now";

  await db.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: "Portfolio Owner",
      role: "OWNER",
      passwordHash: await bcrypt.hash(ownerPassword, 10)
    }
  });
  console.log(`Owner login ready: ${ownerEmail}`);

  const defaultCountries = [
    { name: "United States", isoCode: "USA", defaultCurrency: "USD" },
    { name: "Spain", isoCode: "ESP", defaultCurrency: "EUR" },
    { name: "United Kingdom", isoCode: "GBR", defaultCurrency: "GBP" },
    { name: "United Arab Emirates", isoCode: "UAE", defaultCurrency: "AED" },
    { name: "South Korea", isoCode: "KOR", defaultCurrency: "KRW" }
  ];
  for (const country of defaultCountries) {
    await db.country.upsert({ where: { name: country.name }, update: {}, create: country });
  }
  console.log("Default countries ready.");

  const existing = await db.property.count();
  if (existing > 0) {
    console.log("Sample data already present, skipping demo data seed.");
    return;
  }

  const villaMalaga = await db.property.create({
    data: {
      name: "Villa Alameda",
      addressLine: "Calle del Sol 12",
      city: "Malaga",
      country: "Spain",
      propertyType: "HOUSE",
      status: "OWNED",
      purchasePrice: 420000,
      currentValue: 495000,
      currency: "EUR",
      purchaseDate: new Date("2021-03-15"),
      areaSqm: 180
    }
  });

  const loftLisbon = await db.property.create({
    data: {
      name: "Loft Alfama",
      addressLine: "Rua das Flores 8",
      city: "Lisbon",
      country: "Portugal",
      propertyType: "APARTMENT",
      status: "OWNED",
      purchasePrice: 260000,
      currentValue: 305000,
      currency: "EUR",
      purchaseDate: new Date("2022-06-01"),
      areaSqm: 75
    }
  });

  const officeDubai = await db.property.create({
    data: {
      name: "Marina Office Suite",
      addressLine: "Marina Walk 45",
      city: "Dubai",
      country: "UAE",
      propertyType: "COMMERCIAL",
      status: "FOR_SALE",
      purchasePrice: 810000,
      currentValue: 890000,
      currency: "USD",
      purchaseDate: new Date("2020-11-10"),
      areaSqm: 140
    }
  });

  const condoMiami = await db.property.create({
    data: {
      name: "Brickell Condo 21B",
      addressLine: "Brickell Ave 900",
      city: "Miami",
      country: "USA",
      propertyType: "APARTMENT",
      status: "OWNED",
      purchasePrice: 610000,
      currentValue: 655000,
      currency: "USD",
      purchaseDate: new Date("2023-01-20"),
      areaSqm: 95
    }
  });

  const broker = await db.broker.create({
    data: {
      name: "Elena Cruz",
      agencyName: "Coastal Realty Partners",
      country: "Spain",
      email: "elena@coastalrealty.example",
      defaultCommissionRate: 3
    }
  });

  const lease1 = await db.lease.create({
    data: {
      propertyId: villaMalaga.id,
      tenantName: "Marco Rossi",
      tenantContact: "marco.rossi@example.com",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2026-12-31"),
      rentAmount: 2400,
      currency: "EUR",
      frequency: "MONTHLY",
      status: "ACTIVE",
      depositAmount: 4800
    }
  });

  const lease2 = await db.lease.create({
    data: {
      propertyId: loftLisbon.id,
      tenantName: "Sofia Almeida",
      startDate: new Date("2024-05-01"),
      endDate: new Date("2026-10-31"),
      rentAmount: 1500,
      currency: "EUR",
      frequency: "MONTHLY",
      status: "ACTIVE",
      depositAmount: 3000
    }
  });

  const lease3 = await db.lease.create({
    data: {
      propertyId: condoMiami.id,
      tenantName: "James Carter",
      startDate: new Date("2024-02-01"),
      endDate: new Date("2026-09-30"),
      rentAmount: 3200,
      currency: "USD",
      frequency: "MONTHLY",
      status: "ACTIVE",
      depositAmount: 6400
    }
  });

  const now = new Date();
  for (const lease of [lease1, lease2, lease3]) {
    for (let i = 1; i <= 3; i++) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      await db.rentPayment.create({
        data: {
          leaseId: lease.id,
          dueDate,
          paidDate: dueDate,
          amount: lease.rentAmount,
          currency: lease.currency,
          status: "PAID"
        }
      });
    }
    const currentDue = new Date(now.getFullYear(), now.getMonth(), 1);
    await db.rentPayment.create({
      data: {
        leaseId: lease.id,
        dueDate: currentDue,
        amount: lease.rentAmount,
        currency: lease.currency,
        status: "PENDING"
      }
    });
  }

  await db.tax.createMany({
    data: [
      {
        propertyId: villaMalaga.id,
        taxType: "IBI (Property Tax)",
        country: "Spain",
        taxYear: now.getFullYear(),
        amount: 1450,
        currency: "EUR",
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        status: "PENDING"
      },
      {
        propertyId: loftLisbon.id,
        taxType: "IMI (Municipal Tax)",
        country: "Portugal",
        taxYear: now.getFullYear(),
        amount: 780,
        currency: "EUR",
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 20),
        status: "PENDING"
      },
      {
        propertyId: condoMiami.id,
        taxType: "Property Tax",
        country: "USA",
        taxYear: now.getFullYear(),
        amount: 6200,
        currency: "USD",
        dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
        status: "PENDING"
      }
    ]
  });

  await db.maintenanceVisit.createMany({
    data: [
      {
        propertyId: villaMalaga.id,
        visitDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        vendorName: "Malaga Pool Services",
        description: "Quarterly pool maintenance",
        cost: 180,
        currency: "EUR",
        status: "SCHEDULED"
      },
      {
        propertyId: condoMiami.id,
        visitDate: new Date(now.getFullYear(), now.getMonth(), 28),
        vendorName: "CoolBreeze HVAC",
        description: "AC unit inspection",
        cost: 220,
        currency: "USD",
        status: "SCHEDULED"
      }
    ]
  });

  await db.employee.createMany({
    data: [
      {
        name: "Carla Nunes",
        role: "Property Manager",
        country: "Portugal",
        email: "carla@azportfolio.example",
        salary: 3200,
        currency: "EUR",
        hireDate: new Date("2022-02-01"),
        active: true
      },
      {
        name: "David Kim",
        role: "Accountant",
        country: "USA",
        email: "david@azportfolio.example",
        salary: 5400,
        currency: "USD",
        hireDate: new Date("2023-04-15"),
        active: true
      }
    ]
  });

  const dubaiSale = await db.sale.create({
    data: {
      propertyId: officeDubai.id,
      saleDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      salePrice: 890000,
      currency: "USD",
      buyerName: "Al Fahim Holdings",
      brokerId: broker.id,
      status: "PENDING"
    }
  });

  await db.commission.create({
    data: {
      brokerId: broker.id,
      saleId: dubaiSale.id,
      amount: 26700,
      currency: "USD",
      rate: 3,
      status: "PENDING"
    }
  });

  await db.fee.create({
    data: {
      propertyId: villaMalaga.id,
      feeType: "Property Management Fee",
      amount: 150,
      currency: "EUR",
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      status: "PENDING"
    }
  });

  console.log("Demo data seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
