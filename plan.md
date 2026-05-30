# 🧾 Cashier Ledger App — Full Project Plan

> A bilingual (Arabic/English) daily sales tracking and reconciliation app for cashiers.
> Built with **Next.js 14 (App Router)**, **TypeScript**, **Prisma + PostgreSQL**, and **NextAuth.js**.
> UI design pattern inspired by **Uber** — clean, card-based, high-contrast, task-focused.

---

## 1. Project Overview

The app replaces a cashier's handwritten book. For each sale, the cashier records:
- Buyer's name
- Items purchased
- Payment method (Bank Transfer, Wallet, Cash, or any custom type)
- Payment status (Confirmed, Pending, Cancelled)
- Phone number *(required when status is Pending)*

At the end of each day, the cashier opens the **Daily Summary** to verify that all payments are received and confirmed. Pending transfers are flagged with the buyer's phone number so the cashier can follow up. The full day's data can be exported as a **PDF**.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Your stack, monorepo, SSR + API routes |
| Language | TypeScript | Type safety across the board |
| Database | PostgreSQL | Relational, reliable, great for daily sessions |
| ORM | **Prisma** | Best DX for Next.js, auto-generated types, easy migrations |
| Auth | NextAuth.js (Credentials) | Email + password login, session-based |
| Styling | Tailwind CSS | Fast, utility-first, Uber-like precision |
| PDF Export | `react-pdf` / `@react-pdf/renderer` | Render PDFs from React components |
| State | React `useState` + Server Actions | Minimal, no Redux needed |
| Form handling | `react-hook-form` + `zod` | Validation + TypeScript types from schema |

> **Why Prisma over Drizzle?** Prisma has a more mature ecosystem, excellent TypeScript inference, and the Prisma Studio GUI is very useful during development. For a project of this scope it's the safest choice.

---

## 3. Database Schema

```prisma
model User {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  password  String    // hashed with bcrypt
  createdAt DateTime  @default(now())
  sessions  Session[]
}

model Session {
  id           String        @id @default(cuid())
  date         DateTime      @default(now())
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
  closedAt     DateTime?     // null = still open
}

model Transaction {
  id            String   @id @default(cuid())
  sessionId     String
  session       Session  @relation(fields: [sessionId], references: [id])
  buyerName     String
  buyerPhone    String?  // required if status = PENDING
  items         String   // free-text description of purchased items
  paymentMethod String   // e.g. "Bank Transfer", "Wallet", "Cash"
  amount        Float
  status        Status   @default(PENDING)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Status {
  CONFIRMED
  PENDING
  CANCELLED
}
```

---

## 4. Folder Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Sidebar + topbar
│   │   ├── page.tsx                ← Today's session (main view)
│   │   ├── summary/
│   │   │   └── page.tsx            ← End-of-day summary
│   │   └── history/
│   │       └── page.tsx            ← Past sessions
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts
│       ├── sessions/
│       │   └── route.ts
│       ├── transactions/
│       │   └── route.ts
│       └── export/
│           └── route.ts            ← PDF generation endpoint
├── components/
│   ├── TransactionForm.tsx
│   ├── TransactionTable.tsx
│   ├── TransactionCard.tsx
│   ├── StatusBadge.tsx
│   ├── SummaryStats.tsx
│   ├── DailySummaryPDF.tsx
│   ├── ReceiptPDF.tsx
│   ├── SearchBar.tsx
│   ├── FilterBar.tsx
│   ├── FilterChip.tsx
│   └── LanguageToggle.tsx
├── lib/
│   ├── prisma.ts                   ← Prisma client singleton
│   ├── auth.ts                     ← NextAuth config
│   └── validations.ts              ← Zod schemas
├── i18n/
│   ├── en.json
│   └── ar.json
├── prisma/
│   └── schema.prisma
└── public/
```

---

## 5. Pages & Features

### 5.1 Login Page `/login`
- Email + password form
- NextAuth credentials provider
- Redirect to dashboard on success
- Bilingual toggle button (AR / EN) in the corner

---

### 5.2 Main Dashboard `/` — Today's Session

This is the **primary work screen** the cashier uses all day.

**Top section — Session header:**
- Today's date (displayed prominently)
- "Open Session" button if no session exists for today
- Session status (Open / Closed)

**Middle section — Add Transaction form:**
- Buyer Name (text input)
- Items Purchased (textarea)
- Payment Method (free-text input with autocomplete suggestions: Bank Transfer, Wallet, Cash)
- Amount (number input)
- Status (dropdown: Confirmed / Pending / Cancelled)
- Phone Number (appears and becomes required when status = Pending)
- Submit button → adds entry to the live table below

**Bottom section — Today's transaction table:**
- Columns: #, Buyer, Items, Method, Amount, Status, Phone, Actions
- Inline status update (click badge to toggle)
- Delete button per row
- Color-coded status badges (green / yellow / red)

---

### 5.3 End-of-Day Summary `/summary`

**Stats cards row:**
- Total Transactions
- Total Confirmed Amount
- Total Pending Amount
- Total Cancelled Amount

**Breakdown by payment method:**
- Mini cards: "Bank Transfer — 3,200 JD", "Wallet — 800 JD", "Cash — 500 JD"

**Pending follow-up list:**
- Table of all PENDING transactions with buyer name + phone number
- "Mark as Confirmed" button per row

**Recent transactions table:**
- Full list of today's transactions, sortable by status

**Export buttons:**
- "Export Daily Summary PDF"
- "Export All Receipts PDF"

---

### 5.4 History `/history`
- List of past sessions by date
- Click a session → expand and view its transactions (read-only)
- Export PDF for any past session

**Search bar:**
- Search across all past transactions by **buyer name** or **amount**
- Instant client-side filtering as the cashier types
- Matching text highlighted in results
- Shows which session (date) each result belongs to

**Filter bar (below search):**
- Filter by payment status: `All` | `Confirmed` | `Pending` | `Cancelled`
- Filter by payment method: `All` | `Bank Transfer` | `Wallet` | `Cash` | *(any recorded method)*
- Filter by date range: date-from / date-to inputs
- Active filters shown as dismissible chips/tags
- "Clear all filters" button

**Results view:**
- When search or filters are active → flat list of matching transactions across all sessions, grouped by date
- When nothing is active → default session-list view (collapsed cards per day)
- Result count shown: *"12 transactions found"*

**API support:**
- `GET /api/transactions?search=&status=&method=&from=&to=` — server-side filtered query via Prisma `where` clauses (handles large datasets efficiently)

---

## 6. PDF Export

Two PDF document types generated with `@react-pdf/renderer`:

### Daily Summary PDF
- Store header (cashier name, date)
- Stats: total confirmed, total pending, total cancelled
- Breakdown by payment method
- Full transaction table
- Pending follow-up list with phone numbers

### Per-Transaction Receipt PDF
- Transaction ID
- Buyer name
- Items purchased
- Amount
- Payment method
- Status
- Date & time
- Cashier name

---

## 7. Bilingual Support (AR / EN)

- Language stored in `localStorage` + React Context
- All UI strings externalized to `/i18n/en.json` and `/i18n/ar.json`
- RTL layout toggled via `dir="rtl"` on `<html>` when Arabic is active
- Tailwind's `rtl:` variant used for directional spacing/alignment
- PDF exports respect the selected language

---

## 8. UI Design System — Uber-Inspired

### Design Philosophy
Uber's design language is **utilitarian luxury** — it doesn't try to be pretty, it tries to be *fast and trustworthy*. Clean whites, deep blacks, precise typography, cards with strong shadow hierarchy, and a single strong accent color. Everything is purposeful and dense without feeling crowded.

### Color Palette
```
Background:    #F6F6F6  (off-white surface)
Card:          #FFFFFF  (pure white)
Primary Text:  #000000  (black)
Secondary:     #6B6B6B  (dark gray)
Accent:        #000000  → hover: #1A1A1A  (black CTAs)
Confirmed:     #00A651  (Uber-style green)
Pending:       #F5A623  (amber)
Cancelled:     #E74C3C  (red)
Border:        #E5E5E5  (subtle divider)
```

### Typography
```
Display/Headings:  "Neue Haas Grotesk" or fallback "UberMove", sans-serif
Body:              "Inter" (only practical exception — pairs well with the above)
Numerals/Amounts:  Tabular figures, monospace feel
Arabic fallback:   "Cairo" (Google Fonts — clean, modern Arabic)
```

### Component Style Rules
- Cards: `rounded-2xl`, `shadow-sm`, white background, 1px border `#E5E5E5`
- Buttons: fully black (`bg-black text-white`), `rounded-xl`, no gradients
- Inputs: borderless bottom-line style OR full border `rounded-xl`, focus ring black
- Status badges: pill shape, filled background, white text
- Tables: no outer border, subtle row dividers, sticky header
- Sidebar: white, left-aligned icons + labels, active state = black background
- Topbar: white, date on left, user avatar + logout on right

### Layout
- Sidebar navigation (desktop): 240px fixed width
- Main content: fluid, max-width 1200px, centered
- Mobile: bottom navigation bar (4 icons)
- Transaction form: right-side panel (slide-in drawer on mobile)
- Summary stats: 4-column grid of metric cards

---

## 9. API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/[...nextauth]` | Login / logout |
| GET | `/api/sessions` | Get all sessions for current user |
| POST | `/api/sessions` | Create new session for today |
| GET | `/api/transactions?sessionId=` | Get transactions for a session |
| GET | `/api/transactions?search=&status=&method=&from=&to=` | Search + filter transactions across sessions |
| POST | `/api/transactions` | Add a new transaction |
| PATCH | `/api/transactions/:id` | Update status or any field |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/export?sessionId=&type=summary|receipts` | Generate and return PDF |

---

## 10. Validation Rules (Zod)

```ts
const TransactionSchema = z.object({
  buyerName:     z.string().min(2),
  items:         z.string().min(3),
  paymentMethod: z.string().min(1),
  amount:        z.number().positive(),
  status:        z.enum(["CONFIRMED", "PENDING", "CANCELLED"]),
  buyerPhone:    z.string().optional().refine(
    (val, ctx) => ctx.parent.status !== "PENDING" || (!!val && val.length >= 7),
    { message: "Phone is required for pending payments" }
  ),
});
```

---

## 11. Development Phases

### Phase 1 — Foundation
- [ ] Init Next.js 14 project with TypeScript + Tailwind
- [ ] Set up Prisma + PostgreSQL + run first migration
- [ ] Implement NextAuth credentials login
- [ ] Build layout (sidebar, topbar, responsive shell)

### Phase 2 — Core Features
- [ ] Session creation logic (one per day per user)
- [ ] Transaction form with validation
- [ ] Transaction table with status toggle + delete
- [ ] Today's dashboard fully functional

### Phase 3 — Summary & Export
- [ ] End-of-day summary page with stats
- [ ] Pending follow-up list
- [ ] `@react-pdf/renderer` setup
- [ ] Daily summary PDF template
- [ ] Per-receipt PDF template
- [ ] Export API route

### Phase 4 — Bilingual, Search & Polish
- [ ] i18n context + en/ar JSON files
- [ ] RTL layout switching
- [ ] Arabic PDF support
- [ ] History page — session list + expand view
- [ ] Search bar (buyer name + amount) with highlight
- [ ] Filter bar (status + payment method + date range)
- [ ] Server-side filtered Prisma query for history
- [ ] Active filter chips + clear all
- [ ] Mobile responsive pass

### Phase 5 — QA & Deployment
- [ ] Error boundaries + loading states
- [ ] Auth guards on all routes
- [ ] Deploy on Vercel + managed PostgreSQL (Supabase or Neon)

---

## 12. Recommended Packages

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "typescript": "^5",
    "prisma": "^5",
    "@prisma/client": "^5",
    "next-auth": "^4",
    "bcryptjs": "^2",
    "zod": "^3",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "tailwindcss": "^3",
    "@react-pdf/renderer": "^3",
    "date-fns": "^3",
    "clsx": "^2",
    "tailwind-merge": "^2"
  }
}
```

---

*Plan version 1.1 — updated with search & filter features.*
