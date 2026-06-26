-- Migration to fix RLS for categories in workspaces

-- Drop the old policy
DROP POLICY IF EXISTS "Users own their categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read default categories" ON categories;

-- Create a new comprehensive policy for SELECT
CREATE POLICY "Users can read their own or workspace categories"
  ON categories FOR SELECT
  USING (
    -- It's a personal category owned by the user
    (workspace_id IS NULL AND user_id = auth.uid()) OR
    -- It's a default category assigned to the user
    (workspace_id IS NULL AND is_default = true AND user_id = auth.uid()) OR
    -- It's a default category assigned to everyone globally (legacy support)
    (workspace_id IS NULL AND user_id IS NULL AND is_default = true) OR
    -- It's a category in a workspace the user is a member of
    (workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ))
  );

-- Create a new comprehensive policy for ALL (INSERT, UPDATE, DELETE)
CREATE POLICY "Users can modify their own or workspace categories"
  ON categories FOR ALL
  USING (
    -- It's a personal category owned by the user
    (workspace_id IS NULL AND user_id = auth.uid()) OR
    -- Or it's a category in a workspace the user is a member of
    (workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )) OR
    -- Allow inserting defaults
    (is_default = true)
  );
