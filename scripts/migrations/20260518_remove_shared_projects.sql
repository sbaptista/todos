-- Remove ORBFDBK project and all its todos (cascade)
DELETE FROM projects WHERE code = 'ORBFDBK';

-- Simplify projects select policy — remove shared project visibility
DROP POLICY IF EXISTS "projects: select own" ON projects;
CREATE POLICY "projects: select own" ON projects FOR SELECT
  USING (created_by = auth.uid());

-- Recreate todos policies without is_shared references
DROP POLICY IF EXISTS "todos: select own" ON todos;
CREATE POLICY "todos: select own" ON todos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = todos.product_id
      AND projects.created_by = auth.uid()
  ));

DROP POLICY IF EXISTS "todos: insert own" ON todos;
CREATE POLICY "todos: insert own" ON todos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = todos.product_id
      AND projects.created_by = auth.uid()
  ));

DROP POLICY IF EXISTS "todos: update own" ON todos;
CREATE POLICY "todos: update own" ON todos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = todos.product_id
      AND projects.created_by = auth.uid()
  ));

DROP POLICY IF EXISTS "todos: delete own" ON todos;
CREATE POLICY "todos: delete own" ON todos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = todos.product_id
      AND projects.created_by = auth.uid()
  ));

-- Now safe to drop the column
ALTER TABLE projects DROP COLUMN is_shared;
