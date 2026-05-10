-- ============================================================
-- Roles, user roles, project ownership
-- 2026-05-09
-- ============================================================

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    value INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO public.roles (value, name) VALUES (1, 'Admin'), (2, 'Owner');

-- Add role_id to users (default to Owner = 2)
ALTER TABLE public.users ADD COLUMN role_id INTEGER NOT NULL DEFAULT 2 REFERENCES public.roles(id);

-- Migrate old text role column data
UPDATE public.users SET role_id = 2;
UPDATE public.users SET role_id = 1 WHERE LOWER(role) = 'admin';

-- Drop old text role column
ALTER TABLE public.users DROP COLUMN role;

-- Add created_by to projects
ALTER TABLE public.projects ADD COLUMN created_by UUID REFERENCES public.users(id);

-- Backfill: set Stanley as creator of all existing projects
UPDATE public.projects SET created_by = 'dc030c16-57aa-4fcf-a24b-83d17471a7ac';

ALTER TABLE public.projects ALTER COLUMN created_by SET NOT NULL;

-- ============================================================
-- RLS policies
-- ============================================================

-- Users: Admins can see/update all; owners see only themselves
DROP POLICY IF EXISTS "users: select own" ON public.users;
CREATE POLICY "users: select own" ON public.users
    FOR SELECT USING (
        auth.uid() = id
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
    );

DROP POLICY IF EXISTS "users: update own" ON public.users;
CREATE POLICY "users: update own" ON public.users
    FOR UPDATE USING (
        auth.uid() = id
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
    );

-- Projects: Admins see all; owners see only their own
DROP POLICY IF EXISTS "projects: select own" ON public.projects;
CREATE POLICY "projects: select own" ON public.projects
    FOR SELECT USING (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
    );

DROP POLICY IF EXISTS "projects: insert own" ON public.projects;
CREATE POLICY "projects: insert own" ON public.projects
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id IN (1, 2))
    );

DROP POLICY IF EXISTS "projects: update own" ON public.projects;
CREATE POLICY "projects: update own" ON public.projects
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
    );

DROP POLICY IF EXISTS "projects: delete own" ON public.projects;
CREATE POLICY "projects: delete own" ON public.projects
    FOR DELETE USING (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
    );

-- Todos: scoped through project ownership
DROP POLICY IF EXISTS "todos: select own" ON public.todos;
CREATE POLICY "todos: select own" ON public.todos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = todos.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "todos: insert own" ON public.todos;
CREATE POLICY "todos: insert own" ON public.todos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = todos.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "todos: update own" ON public.todos;
CREATE POLICY "todos: update own" ON public.todos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = todos.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "todos: delete own" ON public.todos;
CREATE POLICY "todos: delete own" ON public.todos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = todos.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

-- Groups: scoped through project ownership
DROP POLICY IF EXISTS "groups: select own" ON public.groups;
CREATE POLICY "groups: select own" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = groups.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "groups: insert own" ON public.groups;
CREATE POLICY "groups: insert own" ON public.groups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = groups.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "groups: update own" ON public.groups;
CREATE POLICY "groups: update own" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = groups.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "groups: delete own" ON public.groups;
CREATE POLICY "groups: delete own" ON public.groups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = groups.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

-- Categories: scoped through project ownership
DROP POLICY IF EXISTS "categories: select own" ON public.categories;
CREATE POLICY "categories: select own" ON public.categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = categories.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "categories: insert own" ON public.categories;
CREATE POLICY "categories: insert own" ON public.categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = categories.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "categories: update own" ON public.categories;
CREATE POLICY "categories: update own" ON public.categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = categories.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "categories: delete own" ON public.categories;
CREATE POLICY "categories: delete own" ON public.categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = categories.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

-- Platforms: scoped through project ownership
DROP POLICY IF EXISTS "platforms: select own" ON public.platforms;
CREATE POLICY "platforms: select own" ON public.platforms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = platforms.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "platforms: insert own" ON public.platforms;
CREATE POLICY "platforms: insert own" ON public.platforms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = platforms.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "platforms: update own" ON public.platforms;
CREATE POLICY "platforms: update own" ON public.platforms
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = platforms.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );

DROP POLICY IF EXISTS "platforms: delete own" ON public.platforms;
CREATE POLICY "platforms: delete own" ON public.platforms
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = platforms.product_id
            AND (
                projects.created_by = auth.uid()
                OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 1)
            )
        )
    );
