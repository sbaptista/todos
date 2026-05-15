-- Migrate hardcoded status values in todos to match the statuses table,
-- then replace the brittle CHECK constraint with a FK to statuses(name).

BEGIN;

-- 1. Drop the hardcoded CHECK constraint first (some rows already have 'closed')
ALTER TABLE todos DROP CONSTRAINT todos_status_check;

-- 2. Migrate stale values to match statuses.name
UPDATE todos SET status = 'closed'      WHERE status = 'done';
UPDATE todos SET status = 'in progress' WHERE status = 'in_progress';
UPDATE todos SET status = 'on hold'     WHERE status = 'on_hold';

-- 3. Add a unique constraint on statuses.name (required for FK target)
ALTER TABLE statuses ADD CONSTRAINT statuses_name_unique UNIQUE (name);

-- 4. Add FK from todos.status → statuses.name with CASCADE update
ALTER TABLE todos
  ADD CONSTRAINT todos_status_fk
  FOREIGN KEY (status) REFERENCES statuses(name)
  ON UPDATE CASCADE ON DELETE RESTRICT;

COMMIT;
