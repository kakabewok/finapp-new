-- =============================================
-- Shared Workspaces: Tables, Columns, RLS, Indexes
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. New Tables
-- =============================================

-- Workspaces table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members table
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

-- Workspace invites table
CREATE TABLE workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. Add workspace_id to existing tables
-- =============================================

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE budget_history ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- =============================================
-- 3. Enable RLS on new tables
-- =============================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. RLS Policies — workspaces
-- =============================================

-- Users can see workspaces they are a member of
CREATE POLICY "Members can view their workspaces"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
    )
  );

-- Only the owner can update workspace details
CREATE POLICY "Owner can update workspace"
  ON workspaces FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Any authenticated user can create a workspace
CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only the owner can delete a workspace
CREATE POLICY "Owner can delete workspace"
  ON workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- =============================================
-- 5. RLS Policies — workspace_members sampe sini
-- =============================================

-- Members can see other members in their workspaces
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- Owner/admin can add members
CREATE POLICY "Owner and admin can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
    -- Also allow the initial owner insert (when creating workspace, no members exist yet)
    OR (
      role = 'owner'
      AND user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = workspace_members.workspace_id
          AND w.owner_id = auth.uid()
      )
    )
  );

-- Owner/admin can remove members; members can remove themselves
CREATE POLICY "Owner/admin can remove members or self-leave"
  ON workspace_members FOR DELETE
  USING (
    -- Self-leave
    user_id = auth.uid()
    OR
    -- Owner/admin removing others
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Owner can update member roles
CREATE POLICY "Owner can update member roles"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role = 'owner'
    )
  );

-- =============================================
-- 6. RLS Policies — workspace_invites
-- =============================================

-- Owner/admin can manage invites for their workspaces
CREATE POLICY "Owner/admin can manage invites"
  ON workspace_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- Anyone authenticated can read invites by token (for join flow)
CREATE POLICY "Anyone can read invites by token"
  ON workspace_invites FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- 7. Update RLS Policies — transactions
-- =============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users own their transactions" ON transactions;

-- Personal transactions: user_id matches and no workspace
CREATE POLICY "Users own their personal transactions"
  ON transactions FOR ALL
  USING (
    workspace_id IS NULL AND auth.uid() = user_id
  )
  WITH CHECK (
    workspace_id IS NULL AND auth.uid() = user_id
  );

-- Workspace transactions: user is a member with appropriate role
CREATE POLICY "Workspace members can view workspace transactions"
  ON transactions FOR SELECT
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = transactions.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members (non-viewer) can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = transactions.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Workspace members can update own transactions"
  ON transactions FOR UPDATE
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = transactions.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = transactions.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Workspace members can delete own transactions"
  ON transactions FOR DELETE
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = transactions.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'member')
    )
  );

-- =============================================
-- 8. Update RLS Policies — budgets
-- =============================================

-- Drop existing policy (if exists)
DROP POLICY IF EXISTS "Users own their budgets" ON budgets;

-- Personal budgets
CREATE POLICY "Users own their personal budgets"
  ON budgets FOR ALL
  USING (
    workspace_id IS NULL AND auth.uid() = user_id
  )
  WITH CHECK (
    workspace_id IS NULL AND auth.uid() = user_id
  );

-- Workspace budgets
CREATE POLICY "Workspace members can view workspace budgets"
  ON budgets FOR SELECT
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = budgets.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members (non-viewer) can insert budgets"
  ON budgets FOR INSERT
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = budgets.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Workspace members (non-viewer) can update budgets"
  ON budgets FOR UPDATE
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = budgets.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = budgets.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Workspace members (non-viewer) can delete budgets"
  ON budgets FOR DELETE
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = budgets.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'member')
    )
  );

-- =============================================
-- 9. Update RLS Policies — budget_history
-- =============================================

DROP POLICY IF EXISTS "Users own their budget history" ON budget_history;

CREATE POLICY "Users own their personal budget history"
  ON budget_history FOR ALL
  USING (
    workspace_id IS NULL AND auth.uid() = user_id
  )
  WITH CHECK (
    workspace_id IS NULL AND auth.uid() = user_id
  );

CREATE POLICY "Workspace members can view workspace budget history"
  ON budget_history FOR SELECT
  USING (
    workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = budget_history.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

-- =============================================
-- 10. Indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_budgets_workspace_id ON budgets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_workspace_id ON budget_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace_id ON workspace_invites(workspace_id);
