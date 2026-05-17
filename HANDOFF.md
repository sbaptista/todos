# HANDOFF.md

> Living session-to-session context for the Orb project.  
> Every AI reads this at session start. Every AI updates it at session end.  
> Committed with each session's code changes. No Downloads exports needed.


## App State

- **Version:** see `/Users/stanleybaptista/Projects/orb/package.json` (canonical - currently v0.4.75)
- **Branch:** main
- **Dev server:** user-started on localhost:3001
- **Live URL:** https://orb-eight-lake.vercel.app

---

## Last Session Completed

**Pre-Alpha Launch Planning, SMTP Configuration, User Details Release Program, and Onboarding Hardening — v0.4.75**

### ORB-98 — Pre-Alpha Launch Planning (Phase 1 & 2 complete, Phase 3 in progress)

#### Invite & Onboarding Overhaul (v0.4.75)
- **Email Delivery Integration:** Upgraded `inviteUser` action to use `supabase.auth.admin.inviteUserByEmail()`, firing real email invites via Resend custom SMTP instead of silent background account creation.
- **Server-Side Onboarding (`completeOnboarding`):** Built [complete-onboarding.ts](file:///Users/stanleybaptista/Projects/orb/app/actions/complete-onboarding.ts) server action utilizing the Admin Client to bypass client-side RLS. It proactively sweeps and deletes any stale ghost records in `public.users` matching the invited email before performing a clean `upsert` of the new credentials. Wired [page.tsx](file:///Users/stanleybaptista/Projects/orb/app/auth/create-account/page.tsx) to consume this action.
- **Hard-Delete Actions:** Upgraded [delete-user.ts](file:///Users/stanleybaptista/Projects/orb/app/actions/delete-user.ts) to execute a clean hard-delete on both the `public.users` database table and Supabase Auth. Wipes all traces of deleted testers, completely eliminating the "user already exists" invite trap.

#### Admin Panels & Dashboard Upgrades
- **Settings Columns Alignment:** Realigned columns in [SettingsUsers.tsx](file:///Users/stanleybaptista/Projects/orb/components/settings/SettingsUsers.tsx) by wrapping the Role Select and Action Button sections in fixed-width containers (`130px` and `220px` respectively) to maintain a perfect, clean table alignment regardless of row actions.
- **User Detail Release Program Selector:** Upgraded [SettingsUserDetail.tsx](file:///Users/stanleybaptista/Projects/orb/components/settings/SettingsUserDetail.tsx) and [get-user-detail.ts](file:///Users/stanleybaptista/Projects/orb/app/actions/get-user-detail.ts) to render an interactive "Release Program" panel. Allows admins to assign, modify, or revoke release stages (`pre-alpha`, `alpha`, `beta`) and displays the cohort enrollment dates.
- **Reinstated Project Configuration:** Re-established the Project Settings page at `/settings/projects` using `SettingsCrudList` to allow admins to create new projects and check their "Shared" column status. Restored the Projects route in the sidebar navigation.
- **Ambient Onboarding welcome flow:** Integrated onboardingwelcome hints and slash command autocomplete list (`/?`, `/tasks`, `/projects`, `/clear`) inside [AmbientDashboard.tsx](file:///Users/stanleybaptista/Projects/orb/components/AmbientDashboard.tsx) and [OrbConversation.tsx](file:///Users/stanleybaptista/Projects/orb/components/OrbConversation.tsx).

---

## Key Decisions

- **Two-layer security model:** RLS for dashboard (owner-only at DB level), server actions for Settings (role-based admin access via `createAdminClient()`).
- **Production SMTP & Domain Authentication:** Connecting custom SMTP with a verified domain (like `stanbaptista.me`) is necessary to bypass sandbox subaddress blocks (like `+suffix` Gmail filters) in Resend.
- **Server Action for Onboarding:** The `/auth/create-account` signup page must use a server action running on the server under admin privileges (`createAdminClient()`) to successfully delete old ghost rows. Client-side deletes violate RLS and silently fail.
- **User Hard Delete:** Admins deleting a user in the UI triggers a clean hard-delete in both the database `public.users` table AND Supabase Auth, completely avoiding "ghost user" re-invite traps.
- **Settings is for administration, not task management.** Todo CRUD removed from Settings; project todos are view-only. Use the Todos page for mutations.
- **Account is not a Settings page.** It's a standalone page accessible from the dashboard user button.
- **Product codes are required.** The conversational AI resolves todos by splitting task codes (e.g., `ORB-73`). Null codes break this.
- **Status names are DB-driven.** The `statuses` table is the single source of truth. Code uses `is_open`/`is_closed` flags, never hardcoded status strings. FK with `ON UPDATE CASCADE` ensures renames propagate automatically.

---

## Next Priorities

1. **PWA Mobile Device Testing:** Verify standalone installation mode and first-run scaling on real devices (iOS/Android) once the pre-alpha invite link is clicked.
2. **Draft Tester Invite Copy:** Finalize the drafted invite email containing PWA setup instructions, first-run tips, and instructions on logging bugs into the newly created shared "Orb Feedback" project.
3. **Trigger Pre-Alpha cohort invite** to the 2 participants.

---

## AI Tool Used Last Session

`2026-05-16 — Antigravity (Gemini 1.5 Pro)`

---

*Updated by AI at end of each session. Committed with session code changes.*
