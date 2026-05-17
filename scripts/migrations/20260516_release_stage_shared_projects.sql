-- ============================================================
-- Release stage, program participation, and shared projects
-- 2026-05-16
-- ============================================================
--
-- Adds:
--   users.release_stage       TEXT nullable
--     Values: 'pre-alpha' | 'alpha' | 'beta' | null (production user)
--     Tracks which release program the user is currently participating in.
--     Cleared or updated as users graduate between stages.
--     NOT a role — testers are regular users; this column tracks lifecycle.
--
--   users.program_joined_at   TIMESTAMPTZ nullable
--     Set once when a user first enters any release program.
--     Never cleared — preserves the "when did this person first join" datum
--     even as their stage changes.
--
--   projects.is_shared        BOOLEAN NOT NULL DEFAULT false
--     Marks a project as visible to all program participants (release_stage IS NOT NULL),
--     regardless of who created it. Used for the "Orb Feedback" project.
--     Admins always see all projects via service role (createAdminClient).
--
-- RLS update:
--   projects: select own — extended to also return shared projects
--   to authenticated users who are in any release program.
-- ============================================================

-- ── Users: release program columns ──────────────────────────

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS release_stage TEXT
        CHECK (release_stage IN ('pre-alpha', 'alpha', 'beta'))
        DEFAULT NULL;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS program_joined_at TIMESTAMPTZ
        DEFAULT NULL;

-- ── Projects: shared flag ────────────────────────────────────

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false;

-- ── RLS: extend project SELECT to include shared projects ────

DROP POLICY IF EXISTS "projects: select own" ON public.projects;

CREATE POLICY "projects: select own" ON public.projects
    FOR SELECT USING (
        -- User's own projects
        created_by = auth.uid()
        OR
        -- Shared projects visible to all release program participants
        (
            is_shared = true
            AND EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.release_stage IS NOT NULL
            )
        )
    );
