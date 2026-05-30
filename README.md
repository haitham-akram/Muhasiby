# Muhasiby — Cashier Ledger

A bilingual daily sales tracking and reconciliation app for cashiers, built with Next.js 14, Prisma, and NextAuth.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Run the dev server:

```bash
npm run dev
```

## Prisma

- Update `DATABASE_URL` in `.env` to point to your PostgreSQL database.
- Generate the Prisma client when you have a database available:

```bash
npx prisma generate
```
