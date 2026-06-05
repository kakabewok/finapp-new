-- =============================================
-- Financial Tracker - Initial Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  budget_monthly DECIMAL(15,2),
  type VARCHAR(20) CHECK (type IN ('expense', 'income', 'both')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IDR',
  category_id UUID REFERENCES categories(id),
  merchant_name VARCHAR(255),
  description TEXT,
  transaction_date DATE NOT NULL,
  receipt_url VARCHAR(500),
  receipt_public_id VARCHAR(255),
  payment_method VARCHAR(100),
  items JSONB,
  tags TEXT[],
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'scan')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users own their transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their categories"
  ON categories FOR ALL USING (auth.uid() = user_id OR is_default = true);

-- Allow inserting default categories (user_id is null for defaults)
CREATE POLICY "Anyone can read default categories"
  ON categories FOR SELECT USING (is_default = true OR auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Seed default categories
-- =============================================
-- We'll insert defaults per-user via the app on first login.
-- This function creates default categories for a new user.
CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (NEW.id, 'Food & Beverage', '🍔', '#FF6B6B', 'expense', true),
    (NEW.id, 'Transportation', '🚗', '#4ECDC4', 'expense', true),
    (NEW.id, 'Shopping', '🛍️', '#45B7D1', 'expense', true),
    (NEW.id, 'Entertainment', '🎬', '#96CEB4', 'expense', true),
    (NEW.id, 'Health', '💊', '#FFEAA7', 'expense', true),
    (NEW.id, 'Utilities', '💡', '#DDA0DD', 'expense', true),
    (NEW.id, 'Education', '📚', '#98D8C8', 'expense', true),
    (NEW.id, 'Income', '💰', '#2ECC71', 'income', true),
    (NEW.id, 'Other', '📦', '#95A5A6', 'both', true);
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create default categories when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories_for_user();

-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_categories_user_id ON categories(user_id);
