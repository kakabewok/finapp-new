-- =============================================
-- Fix: Infinite recursion in workspace_members RLS
-- 
-- Problem: RLS policies on workspace_members query workspace_members
-- itself to check membership, causing infinite recursion (error 42P17).
--
-- Solution: Use a SECURITY DEFINER function that bypasses RLS to check
-- if the current user is a member of a given workspace.
-- =============================================

-- 1. Create a SECURITY DEFINER helper function
--    This runs with the privileges of the function owner (bypasses RLS),
--    breaking the infinite recursion cycle.
CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
  );
$$;

-- Helper to check if the current user has a specific role in a workspace
CREATE OR REPLACE FUNCTION get_workspace_role(p_workspace_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = auth.uid()
  LIMIT 1;
$$;

-- =============================================
-- 2. Drop the old recursive policies on workspace_members
-- =============================================

DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Owner and admin can add members" ON workspace_members;
DROP POLICY IF EXISTS "Owner/admin can remove members or self-leave" ON workspace_members;
DROP POLICY IF EXISTS "Owner can update member roles" ON workspace_members;

-- =============================================
-- 3. Recreate policies using the helper functions
-- =============================================

-- SELECT: Members can see other members in their workspaces
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    is_workspace_member(workspace_id)
  );

-- INSERT: Owner/admin can add members; also allow initial owner insert
CREATE POLICY "Owner and admin can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    get_workspace_role(workspace_id) IN ('owner', 'admin')
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

-- DELETE: Self-leave or owner/admin can remove others
CREATE POLICY "Owner/admin can remove members or self-leave"
  ON workspace_members FOR DELETE
  USING (
    -- Self-leave
    user_id = auth.uid()
    OR
    -- Owner/admin removing others
    get_workspace_role(workspace_id) IN ('owner', 'admin')
  );

-- UPDATE: Only owner can update member roles
CREATE POLICY "Owner can update member roles"
  ON workspace_members FOR UPDATE
  USING (
    get_workspace_role(workspace_id) = 'owner'
  )
  WITH CHECK (
    get_workspace_role(workspace_id) = 'owner'
  );
