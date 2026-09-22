# MyERP — AZ Portfolio

A real estate portfolio management dashboard: track properties across
multiple countries, leases and rent collection, taxes, sales, maintenance
visits, staff, brokers, commissions, and fees — all from one owner login.

Built as an original Next.js app (not a fork of any existing product), so
it's yours to brand and deploy freely.

## Stack

- **Next.js 15** (App Router, Server Actions) + TypeScript
- **PostgreSQL** via **Prisma**
- **NextAuth** (credentials login, single owner account)
- **Tailwind CSS** + **Recharts** for the dashboard

## Local development

```bash
cp .env.example .env
# fill in DATABASE_URL (a local Postgres), NEXTAUTH_SECRET (openssl rand -base64 32),
# and SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD for your first login

npm install
npx prisma migrate dev
npm run seed      # creates your owner login + demo data
npm run dev
```

Visit `http://localhost:3000` and log in with the email/password you set in
`SEED_OWNER_PASSWORD`.

## Deploying on Vercel

1. Import this repo into a new Vercel project (auto-detected as Next.js).
2. In the project's **Storage** tab, add a **Postgres** database — this
   injects `DATABASE_URL` automatically, no manual copy-paste needed.
3. Add two more environment variables in **Settings → Environment
   Variables**:
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your production URL (e.g. `https://your-app.vercel.app`)
4. Deploy. The build script (`prisma generate && prisma migrate deploy && next build`)
   applies migrations automatically on every deploy.
5. Create your owner login once, from your local machine, pointed at the
   production database:
   ```bash
   DATABASE_URL="<paste production DATABASE_URL>" \
   SEED_OWNER_EMAIL="you@example.com" \
   SEED_OWNER_PASSWORD="a-strong-password" \
   npm run seed
   ```
   (Re-running `seed` later is safe — it skips the demo data step once any
   property exists, and only upserts the owner login.)

Every push to `main` redeploys automatically once the GitHub repo is linked
to the Vercel project.

## Data model

See `prisma/schema.prisma` for the full model. Core entities: `Property`,
`Lease` + `RentPayment`, `Tax`, `Sale`, `MaintenanceVisit`, `Employee`,
`Broker` + `Commission`, `Fee`.
