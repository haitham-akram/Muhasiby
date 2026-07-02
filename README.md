# Muhasiby — Cashier Ledger

A bilingual (English/Arabic) daily sales tracking and reconciliation application for cashiers, built with **Next.js 14**, **Prisma**, **NextAuth**, and **Tailwind CSS**.

## Overview

Muhasiby is a point-of-sale (POS) and cash management system designed for small businesses, particularly retail shops and market stalls. It provides:

- **Daily session management** — Cashiers open/close shifts with reconciliation
- **Transaction recording** — Multi-item sales with split payment methods (Cash/Card/Mobile)
- **Inventory tracking** — Product catalog with stock management
- **Customer management** — Customer database with purchase history
- **Provider/Supplier management** — Track bills, payments, and outstanding balances
- **Reports & Analytics** — Daily summaries, PDF receipts, and provider statements
- **Role-based access** — Admin and Cashier roles with different permissions
- **Bilingual support** — Full English/Arabic RTL support

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL with Prisma ORM |
| Authentication | NextAuth.js (credentials provider) |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod validation |
| PDF Generation | @react-pdf/renderer |
| State Management | SWR for data fetching |
| Internationalization | Custom i18n (English/Arabic) |
| Language | TypeScript |

## Project Structure

```
muhasiby/
├── app/
│   ├── (auth)/           # Authentication routes (login)
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── cashiers/     # Cashier management (Admin only)
│   │   ├── customers/    # Customer CRUD & history
│   │   ├── history/      # Transaction history with filters
│   │   ├── inventory/    # Product catalog management
│   │   ├── providers/    # Supplier bills & payments
│   │   └── summary/      # Daily summary & reports
│   ├── api/              # API routes (transactions, sessions, etc.)
│   ├── layout.tsx        # Root layout with providers
│   └── providers.tsx     # React context providers
├── components/           # Reusable UI components
├── lib/                  # Utility functions & configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client singleton
│   ├── i18n.ts           # Internationalization helpers
│   ├── validations.ts    # Zod schemas
│   └── types.ts          # Shared TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema
├── i18n/                 # Translation files (en/ar)
└── hooks/                # Custom React hooks
```

## Database Schema

Key models:

- **User** — Cashiers and admins with role-based access
- **Session** — Daily cashier shifts (open/close with reconciliation)
- **Transaction** — Sales records with multi-item support
- **TransactionItem** — Individual line items in a transaction
- **Product** — Inventory items with default pricing
- **Customer** — Customer database with phone-based lookup
- **Provider** — Suppliers/vendors
- **Bill** — Purchase orders from providers
- **BillItem** — Line items in provider bills
- **ProviderPayment** — Payments made to providers
- **PaymentSplit** — Multiple payment methods per transaction

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd muhasiby
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database connection:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/muhasiby"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   # Optional: seed initial data
   node prisma/seed.js
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Key Features

### For Cashiers
- **Open/Close Session** — Start and end daily shifts with cash reconciliation
- **Quick Sale Entry** — Add products, quantities, and split payments (Cash/Card/Mobile)
- **Customer Lookup** — Search/select customers by name or phone
- **Print Receipts** — Generate PDF receipts for transactions
- **View History** — Filter transactions by date, status, payment method

### For Admins
- **Cashier Management** — Create/edit/deactivate cashier accounts
- **Inventory Management** — Add/edit products, set prices, track stock
- **Provider Management** — Track supplier bills, record payments, view outstanding balances
- **Daily Summary** — View aggregated sales, payment breakdowns, and session status
- **Reports** — Export PDF summaries and provider statements

## Internationalization

The app supports **English** and **Arabic (RTL)** out of the box.

- Translation files: `i18n/en.json` and `i18n/ar.json`
- Language switching via the header dropdown
- RTL layout automatically applied for Arabic

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma db push` | Push schema changes to database |
| `npx prisma studio` | Open Prisma Studio GUI |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption | Yes |
| `NEXTAUTH_URL` | Base URL of the application | Yes |

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker
```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — feel free to use and modify for your own projects.

---

**Built with ❤️ for small business owners who need simple, reliable cash management.**