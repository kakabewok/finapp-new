-- =============================================
-- Fix: RLS violation on workspace creation
-- 
-- Problem: When creating a workspace, the API calls .insert().select().
-- The .select() appends a RETURNING clause, which requires the newly
-- inserted row to pass the SELECT policy for the `workspaces` table.
-- The previous SELECT policy only checked `workspace_members`, but the
-- member row hasn't been created yet (it happens in the next API step).
-- This causes the INSERT to fail with an RLS violation.
--
-- Solution: Allow the owner of the workspace to SELECT it, so the
-- .insert().select() succeeds immediately.
-- =============================================

-- Drop the old policy
DROP POLICY IF EXISTS "Members can view their workspaces" ON workspaces;

-- Recreate it to allow owners OR members to view the workspace
CREATE POLICY "Members can view their workspaces"
  ON workspaces FOR SELECT
  USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
    )
  );
