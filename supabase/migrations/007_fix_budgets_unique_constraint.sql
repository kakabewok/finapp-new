-- =============================================
-- Fix: Budgets unique constraint with workspaces
-- 
-- Problem: The old unique constraint on `budgets` prevented a user
-- from having a budget for the same category and month/year across
-- different workspaces (or personal vs workspace).
--
-- Solution: Drop the old constraint and replace it with partial
-- unique indexes that account for `workspace_id`.
-- =============================================

-- 1. Drop the existing unique constraint
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_id_month_year_key;

-- Also try to drop it as an index just in case it was created as an index
DROP INDEX IF EXISTS budgets_user_id_category_id_month_year_key;

-- 2. Create partial unique index for personal budgets (workspace_id IS NULL)
-- This ensures a user can only have one budget per category per period in their personal space
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_personal_unique 
  ON budgets(user_id, category_id, month, year) 
  WHERE workspace_id IS NULL;

-- 3. Create partial unique index for workspace budgets (workspace_id IS NOT NULL)
-- This ensures a workspace can only have one budget per category per period
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_workspace_unique 
  ON budgets(workspace_id, category_id, month, year) 
  WHERE workspace_id IS NOT NULL;
