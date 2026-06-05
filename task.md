# Financial Tracker - Build Tasks

## Phase 1: Project Foundation & Auth
- [x] Install all dependencies
- [x] Create .env.local.example
- [x] Create SQL migration file
- [x] Update globals.css with design system
- [x] Create types/index.ts
- [x] Create lib/utils.ts
- [x] Create lib/supabase/client.ts & server.ts
- [x] Create proxy.ts (auth route protection)
- [x] Update root layout.tsx
- [x] Create auth layout + login/register pages
- [x] Create auth callback route
- [x] Create components.json for shadcn

## Phase 2: Dashboard Layout & Sidebar
- [x] Create ThemeProvider
- [x] Create Sidebar component
- [x] Create Header component  
- [x] Create dashboard layout.tsx

## Phase 3: Manual Transaction CRUD
- [x] Create shadcn/ui components needed
- [x] Create API routes: transactions, categories
- [x] Create TransactionForm component
- [x] Create TransactionList component
- [x] Create TransactionDetail component
- [x] Create transactions page + detail page

## Phase 4: Dashboard with Charts
- [x] Create dashboard API route
- [x] Create SummaryCards
- [x] Create SpendingTrendChart
- [x] Create CategoryBreakdown
- [x] Create IncomeExpenseChart
- [x] Create RecentTransactions
- [x] Create dashboard page

## Phase 5: AI Receipt Scanner
- [ ] Create lib/cloudinary.ts
- [ ] Create lib/gemini.ts
- [ ] Create scan API route
- [ ] Create ReceiptUploader
- [ ] Create ScanResult + ConfirmationForm
- [ ] Create scan page

## Phase 6: Category & Budget Management
- [ ] Create categories page
- [ ] Create budget API route
- [ ] Create budget page

## Phase 7: CSV Export
- [ ] Create export API route
- [ ] Add export button to transactions page

## Phase 8: Verification
- [ ] npm run build passes
- [ ] npm run dev starts cleanly
