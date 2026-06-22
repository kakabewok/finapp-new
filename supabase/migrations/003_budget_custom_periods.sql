-- =============================================
-- Budget Planner: Custom Date Periods, Recurring, Rollover
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add new columns to budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS is_rollover BOOLEAN DEFAULT false;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS rollover_amount NUMERIC(15,2) DEFAULT 0;

-- 2. Backfill existing rows: derive start_date/end_date from month/year
UPDATE budgets SET
  start_date = make_date(year, month, 1),
  end_date = (make_date(year, month, 1) + INTERVAL '1 month' - INTERVAL '1 day')::date,
  is_recurring = false,
  is_rollover = false,
  status = 'active',
  rollover_amount = 0
WHERE start_date IS NULL;

-- 3. Now make start_date and end_date NOT NULL
ALTER TABLE budgets ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN end_date SET NOT NULL;

-- 4. Drop the old budget_summary view (we compute summaries in the API now)
DROP VIEW IF EXISTS budget_summary;

-- 5. Create budget_history table for archiving renewed periods
CREATE TABLE IF NOT EXISTS budget_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  planned_amount NUMERIC(15,2) NOT NULL,
  total_spent NUMERIC(15,2) DEFAULT 0,
  remaining_amount NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS for budget_history
ALTER TABLE budget_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their budget history"
  ON budget_history FOR ALL USING (auth.uid() = user_id);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budget_history_budget_id ON budget_history(original_budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_user_id ON budget_history(user_id);
