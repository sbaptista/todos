ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_dormant boolean NOT NULL DEFAULT false;
