# ✅ Features To Implement

These features have been approved and will be built.

---

## New Features

### 💳 Split Payment (Multiple Payment Methods)
Allow a customer to pay part in Cash and part via Card/Mobile Money.
- Replace `paymentMethod: string` with multiple payment splits
- Show running "remaining balance" as the cashier fills in splits
- Requires Prisma schema changes + migration

### 📊 Real-Time Dashboard Stats Bar
Sticky stats bar at the top showing live today's figures:
- Total confirmed sales, pending amount, transaction count, top-selling product
- Auto-refresh via SWR

### 🔍 Product Autocomplete in Cart (Replace `<datalist>`)
Replace the unreliable native `<datalist>` with a proper accessible autocomplete dropdown:
- Keyboard navigable combobox pattern
- Shows product name + price in dropdown
- Auto-fills price on selection

### 🧾 Customer History / Buyer Ledger
Track repeat customers by phone number:
- "Customers" page listing buyers with transaction history
- Total spent, pending balance, last visit date

### 🌙 Dark Mode
Full dark theme using existing CSS variable system:
- Toggle stored in `localStorage`
- Applies `dark` class to `<html>`
- All CSS variables mapped to dark equivalents

---

## Optimizations

### A. SWR for Data Fetching
Replace raw `fetch` + `useState` patterns with SWR:
- Stale-while-revalidate caching
- Auto-revalidation on window focus
- Deduplication of concurrent requests

### C. Virtualize TransactionTable
Use `@tanstack/react-virtual` to only render visible rows for large datasets.

### D. Optimistic UI Updates
Add transactions to the list immediately before API confirmation, revert on error.

### E. Image Lazy Loading
Apply `loading="lazy"` and Next.js `<Image>` best practices for any future product images.
