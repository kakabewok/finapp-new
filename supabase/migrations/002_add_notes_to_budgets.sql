-- =============================================
-- Add notes column to budgets table
-- Run this in Supabase SQL Editor
-- =============================================

ALTER TABLE budgets ADD COLUMN IF NOT EXISTS notes TEXT;
