-- Migration to add workspace_id to categories

ALTER TABLE categories ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_categories_workspace_id ON categories(workspace_id);
