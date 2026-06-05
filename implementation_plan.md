# Personal Financial Tracker with AI Receipt Scanner

Build a complete personal financial tracker with AI-powered receipt scanning using Next.js 16, Supabase, Cloudinary, and Google Gemini.

## User Review Required

> [!IMPORTANT]
> **Next.js 16 Breaking Change — `proxy.ts` replaces `middleware.ts`**
> This project uses Next.js **16.2.7**, which has renamed `middleware.ts` → `proxy.ts` and the exported function from `middleware()` → `proxy()`. All route protection and session refresh logic will use the new convention. The Supabase SSR integration will be adapted accordingly.

> [!IMPORTANT]
> **Tailwind CSS v4** is installed (via `@tailwindcss/postcss`). This version uses `@import "tailwindcss"` syntax and `@theme` blocks instead of `tailwind.config.js`. All styling will follow Tailwind v4 conventions with the `@theme inline` block in `globals.css` for design tokens.

> [!WARNING]
> **Supabase Project Setup Required**: You must have a Supabase project created with the SQL schema executed before the app will function. The `.env.local` file needs real credentials. I'll create the `.env.local.example` template and the SQL migration file for you to run in the Supabase dashboard.

> [!WARNING]
> **External API Keys Required**: Cloudinary and Google Gemini API keys must be configured. The app will gracefully handle missing keys with appropriate error messages.

## Open Questions

> [!IMPORTANT]
> 1. **Supabase credentials**: Do you already have a Supabase project set up, or should I include detailed setup instructions?
> 2. **Cloudinary account**: Do you have a Cloudinary account ready, or should the receipt scanner work with a local file fallback initially?
> 3. **Google Gemini API Key**: Do you have a Gemini API key ready?
> 4. **`src/` directory**: Your spec shows `src/` directory structure, but the current project has `app/` at root level. Should I move everything under `src/` or keep the current root-level `app/` structure? (I recommend keeping root-level to match the existing setup.)
> 5. **shadcn/ui**: The user spec requests shadcn/ui. Should I initialize it with the CLI, or manually create the needed components? (I recommend CLI initialization for proper setup.)

---

## Proposed Changes

This is a large project. I'll build it in 8 phases as specified in your development order. Below is the full breakdown.

---

### Phase 1: Project Foundation & Auth

#### [MODIFY] [package.json](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/package.json)
Add all required dependencies:
- `@supabase/supabase-js`, `@supabase/ssr` — Supabase client + SSR auth
- `cloudinary` — server-side Cloudinary uploads
- `@google/generative-ai` — Gemini API for receipt OCR  
- `recharts` — charts for dashboard
- `zod` — schema validation
- `react-hook-form`, `@hookform/resolvers` — form management
- `sonner` — toast notifications
- `lucide-react` — icon library
- `date-fns` — date utilities
- `clsx`, `tailwind-merge` — utility class merging
- `class-variance-authority` — component variants (shadcn dependency)
- `@radix-ui/*` — headless UI primitives (shadcn dependencies)
- `papaparse` — CSV export

#### [MODIFY] [next.config.ts](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/next.config.ts)
- Add `images.remotePatterns` for Cloudinary and Supabase domains
- Configure `serverExternalPackages` if needed

#### [NEW] .env.local.example
Template with all required environment variables.

#### [NEW] supabase/migrations/001_initial_schema.sql
Complete SQL migration with categories, transactions tables, RLS policies, and default category seed data.

#### [MODIFY] [globals.css](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/globals.css)
Complete design system with Tailwind v4 `@theme inline` block:
- Color palette (dark mode support via CSS variables)
- Typography scale
- Spacing, border-radius tokens
- shadcn/ui CSS variable integration

#### [NEW] components.json
shadcn/ui configuration file.

#### [NEW] lib/utils.ts
Utility functions: `cn()` class merger, currency formatter (IDR), date formatter.

#### [NEW] lib/supabase/client.ts
Browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`.

#### [NEW] lib/supabase/server.ts
Server-side Supabase client using `createServerClient` from `@supabase/ssr` with cookie handling.

#### [NEW] proxy.ts
Route protection proxy (replaces middleware.ts in Next.js 16):
- Refresh Supabase auth session on every request
- Redirect unauthenticated users from `/dashboard/*` to `/login`
- Redirect authenticated users from `/login`, `/register` to `/dashboard`
- Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, API routes

#### [NEW] types/index.ts
TypeScript interfaces: `Transaction`, `Category`, `ScanResult`, `TransactionFormData`, `DashboardSummary`.

#### [NEW] app/(auth)/layout.tsx
Auth pages layout — centered card design with gradient background.

#### [NEW] app/(auth)/login/page.tsx
Login page with email/password form and Google OAuth button.

#### [NEW] app/(auth)/register/page.tsx
Registration page with email/password form.

#### [NEW] app/auth/callback/route.ts
OAuth callback route handler for Supabase Google OAuth flow.

---

### Phase 2: Dashboard Layout & Sidebar

#### [NEW] app/(dashboard)/layout.tsx
Dashboard shell layout:
- Collapsible sidebar with navigation links (Dashboard, Transactions, Scan Receipt, Categories, Budget)
- Top header bar with user profile dropdown and dark mode toggle
- Responsive: slide-out drawer on mobile, fixed sidebar on desktop
- Active route highlighting

#### [NEW] components/layout/Sidebar.tsx
Sidebar component with emoji icons, nav items, and collapse toggle.

#### [NEW] components/layout/Header.tsx
Top bar with search, dark mode toggle, user avatar dropdown.

#### [NEW] components/layout/ThemeProvider.tsx
Dark mode provider using `next-themes` or manual class-based toggle.

#### [MODIFY] [layout.tsx](file:///d:/NOPRIZAL/BELAJAR/PROGRAMMING/JAVASCRIPT/COURSE/LARAVEL/laragon/www/financial-planner-final-05-06-2026/finapp/app/layout.tsx)
Update root layout: add theme provider, Toaster, font config, `suppressHydrationWarning`.

---

### Phase 3: Manual Transaction CRUD

#### [NEW] app/api/transactions/route.ts
- `GET`: List transactions with pagination, filters (date range, category, type, amount range, search), sort
- `POST`: Create new transaction with Zod validation

#### [NEW] app/api/transactions/[id]/route.ts
- `GET`: Single transaction detail
- `PUT`: Update transaction
- `DELETE`: Delete transaction

#### [NEW] app/api/categories/route.ts
- `GET`: List user's categories (defaults + custom)
- `POST`: Create custom category

#### [NEW] app/api/categories/[id]/route.ts
- `PUT`: Update category (name, icon, color, budget)
- `DELETE`: Delete custom category

#### [NEW] components/transactions/TransactionForm.tsx
Full form with:
- Type selector (Income/Expense/Transfer) with color-coded tabs
- Amount input with IDR formatting
- Category dropdown with emoji icons
- Date/time picker
- Merchant name / description fields
- Optional payment proof upload
- Optional tags input
- Zod + react-hook-form validation

#### [NEW] components/transactions/TransactionList.tsx
Paginated table/list with:
- Filter bar (date range, category, type, amount range)
- Search input
- Sort controls
- Transaction row items with emoji, amount, category badge
- Click to expand/view detail

#### [NEW] components/transactions/TransactionDetail.tsx
Detail view showing all fields including receipt thumbnail if available.

#### [NEW] app/(dashboard)/transactions/page.tsx
Transactions list page integrating the above components.

#### [NEW] app/(dashboard)/transactions/[id]/page.tsx
Single transaction detail page with edit/delete actions.

---

### Phase 4: Dashboard with Charts

#### [NEW] app/(dashboard)/page.tsx
Main dashboard page with grid layout and date/category filters.

#### [NEW] components/dashboard/SummaryCards.tsx
4 cards: Total Income, Total Expenses, Net Balance, % Change vs last month.
Animated count-up effect, color-coded with trend indicators.

#### [NEW] components/dashboard/SpendingTrendChart.tsx
Recharts `LineChart` — 30-day spending trend with gradient fill.

#### [NEW] components/dashboard/CategoryBreakdown.tsx
Recharts `PieChart` (donut) — spending breakdown by category with legend.

#### [NEW] components/dashboard/IncomeExpenseChart.tsx
Recharts `BarChart` — 6-month income vs expense comparison.

#### [NEW] components/dashboard/RecentTransactions.tsx
Table of last 10 transactions with quick actions.

#### [NEW] app/api/dashboard/route.ts
Aggregation endpoint: summary stats, chart data, recent transactions.

---

### Phase 5: AI Receipt Scanner

#### [NEW] lib/cloudinary.ts
Cloudinary upload utility (server-side, using `cloudinary` SDK).

#### [NEW] lib/gemini.ts
Gemini API wrapper:
- Send image URL to Gemini 2.5 Flash
- Structured extraction prompt from spec
- JSON response parsing with fallback

#### [NEW] app/api/scan/route.ts
POST handler:
1. Receive multipart form data (image file)
2. Upload to Cloudinary → get `secure_url`, `public_id`
3. Send image URL to Gemini with structured extraction prompt
4. Parse JSON response
5. Return `{ receiptUrl, publicId, extractedData }` (extractedData may be null on parse failure)

#### [NEW] components/scanner/ReceiptUploader.tsx
Upload component:
- Drag & drop zone
- File input (accept images)
- Camera capture button (mobile)
- Image preview
- Upload progress indicator

#### [NEW] components/scanner/ScanResult.tsx
Display extracted data in a readable format before editing.

#### [NEW] components/scanner/ConfirmationForm.tsx
Pre-filled editable form with extracted data:
- All fields from scan result
- Items list (add/remove/edit line items)
- Category override
- Confirm button to save to Supabase

#### [NEW] app/(dashboard)/scan/page.tsx
Full scanner flow page: Upload → Processing → Review → Confirm → Saved.

---

### Phase 6: Category & Budget Management

#### [NEW] app/(dashboard)/categories/page.tsx
Category management page:
- Grid of category cards with emoji, color, budget
- Add new category dialog
- Edit/delete actions
- Default categories are read-only (no delete)

#### [NEW] app/(dashboard)/budget/page.tsx
Budget tracking page:
- Monthly budget overview
- Per-category progress bars (spending vs budget)
- Warning state at 80%, alert at 100%
- Budget setting inline or via dialog

#### [NEW] app/api/budget/route.ts
Budget data endpoint: current month spending per category vs budget limits.

---

### Phase 7: CSV Export

#### [NEW] app/api/export/route.ts
CSV export endpoint:
- Accept date range and filter parameters
- Query transactions
- Generate CSV with proper headers
- Return as downloadable file with `Content-Disposition` header

---

### Phase 8: UI Components (shadcn/ui)

#### [NEW] components/ui/*.tsx
shadcn/ui components needed (will be initialized via CLI or created manually):
- `Button`, `Input`, `Label`, `Card`, `Dialog`, `Select`, `Badge`
- `Table`, `Tabs`, `Avatar`, `DropdownMenu`, `Sheet` (mobile sidebar)
- `Calendar`, `DatePicker`, `Progress`, `Skeleton`, `Separator`
- `AlertDialog` (delete confirmation), `Popover`, `Command` (search)

---

## Project Structure (Final)

```
finapp/
├── proxy.ts                          # Auth route protection (Next.js 16)
├── .env.local.example
├── supabase/
│   └── migrations/001_initial_schema.sql
├── app/
│   ├── globals.css                   # Design system + shadcn tokens
│   ├── layout.tsx                    # Root layout
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── auth/callback/route.ts        # OAuth callback
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Sidebar + nav shell
│   │   ├── page.tsx                  # Dashboard
│   │   ├── transactions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── scan/page.tsx
│   │   ├── categories/page.tsx
│   │   └── budget/page.tsx
│   └── api/
│       ├── dashboard/route.ts
│       ├── transactions/route.ts
│       ├── transactions/[id]/route.ts
│       ├── categories/route.ts
│       ├── categories/[id]/route.ts
│       ├── scan/route.ts
│       ├── budget/route.ts
│       └── export/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ThemeProvider.tsx
│   ├── dashboard/
│   │   ├── SummaryCards.tsx
│   │   ├── SpendingTrendChart.tsx
│   │   ├── CategoryBreakdown.tsx
│   │   ├── IncomeExpenseChart.tsx
│   │   └── RecentTransactions.tsx
│   ├── scanner/
│   │   ├── ReceiptUploader.tsx
│   │   ├── ScanResult.tsx
│   │   └── ConfirmationForm.tsx
│   ├── transactions/
│   │   ├── TransactionList.tsx
│   │   ├── TransactionForm.tsx
│   │   └── TransactionDetail.tsx
│   └── ui/                           # shadcn/ui primitives
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── cloudinary.ts
│   ├── gemini.ts
│   └── utils.ts
└── types/
    └── index.ts
```

---

## Verification Plan

### Automated Tests
- `npm run build` — Ensure no TypeScript or build errors
- `npm run lint` — ESLint checks

### Manual Verification
1. **Auth flow**: Register → Login → Protected routes redirect → Logout
2. **Transaction CRUD**: Add → Edit → Delete → List with filters & pagination
3. **Dashboard**: Charts render with data, summary cards update, date filter works
4. **Receipt Scanner**: Upload image → Gemini extraction → Edit form → Save
5. **Categories**: Create custom → Edit → Delete → Default categories protected
6. **Budget**: Set limits → Progress bars → Warning/alert states
7. **CSV Export**: Download filtered transactions as CSV
8. **Dark Mode**: Toggle works across all pages
9. **Mobile**: Responsive sidebar, scanner camera capture
10. **Dev server**: `npm run dev` starts without errors

---

## Estimated File Count
~50+ files across all phases. I'll create them feature-by-feature, testing each phase before moving to the next.
