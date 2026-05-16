# HANDOFF.md

> Living session-to-session context for the Orb project.  
> Every AI reads this at session start. Every AI updates it at session end.  
> Committed with each session's code changes. No Downloads exports needed.


## App State

- **Version:** see `/Users/stanleybaptista/Projects/orb/package.json` (canonical)
- **Branch:** main
- **Dev server:** user-started on localhost:3001
- **Live URL:** https://orb-eight-lake.vercel.app

---

## Last Session Completed

**Bug fixes + audit — v0.4.65–v0.4.66**

### ORB-103 — Settings > Tickets priority lookup returns null (closed, v0.4.65)
- **Root cause:** RLS enabled on `priorities` table with no explicit SELECT policy. The ALL policy (`auth.uid() IS NOT NULL`) was not reliably granting read access to the browser client.
- **First attempt:** Added auth-gated SELECT policy — still returned null.
- **Final fix:** Replaced with public SELECT policy (`USING (true)`). Priorities is a reference table — public read is appropriate.
- **Migration:** `scripts/migrations/20260515_priorities_select_policy.sql` (executed)
- **Also:** Removed debug console.log from SettingsFriction.tsx
- **Knowledge repo entry:** "Supabase ALL RLS policy does not reliably grant SELECT to browser clients"

### Multi-todo query filtering (fixed, v0.4.66)
- **Root cause:** `query_todos` tool only accepted a single `code` string. When user asked for multiple todos (e.g. "show ORB-102, ORB-103, ORB-104"), only one was returned.
- **Fix:** Added `codes` array parameter to `query_todos` tool schema (orb-contract.ts) and batch lookup handler (orb-converse.ts). Single `code` path unchanged.

### ORB-101 — Orb listed closed tasks as open (closed, no code change)
- Already resolved by prior session's integrity rules rewrite + backlog format fix (v0.4.63).
- Closed with resolution notes and knowledge repo entry.

### ORB-104 — Reusable page/component templates (opened, audit complete)
- Audited all 14 settings components and identified four shared patterns.
- **Highest-value extraction:** CRUD List Page template — 5 pages (Categories, Groups, Platforms, Priorities, Statuses) share ~80% structure. A generic component could eliminate ~800 lines.
- See "Next Priorities" for phased plan.

### Files changed (worktree: upbeat-shockley-f93f13)
- `package.json` — version 0.4.66
- `lib/version.ts` — version 0.4.66
- `components/settings/SettingsFriction.tsx` — removed debug console.log
- `lib/orb-contract.ts` — added `codes` array param to query_todos tool
- `app/actions/orb-converse.ts` — added batch code lookup handler for query_todos
- `scripts/migrations/20260515_priorities_select_policy.sql` — new migration (executed)

---

## Key Decisions

- **Two-layer security model:** RLS for dashboard (owner-only at DB level), server actions for Settings (role-based admin access via `createAdminClient()`).
- **Settings is for administration, not task management.** Todo CRUD removed from Settings; project todos are view-only. Use the Todos page for mutations.
- **Account is not a Settings page.** It's a standalone page accessible from the dashboard user button.
- **Product codes are required.** The conversational AI resolves todos by splitting task codes (e.g., `ORB-73`). Null codes break this.
- **Status names are DB-driven.** The `statuses` table is the single source of truth. Code uses `is_closed` flag, never hardcoded status strings. FK with `ON UPDATE CASCADE` ensures renames propagate automatically.
- **Reference tables need public SELECT policies.** Supabase ALL policies don't reliably grant SELECT to browser clients. Always add explicit SELECT policies.

---

## Next Priorities

1. **ORB-104: Reusable templates — Phase 1: CRUD List Page**
   - Extract `SettingsCrudList` generic component from Categories/Groups/Platforms/Priorities/Statuses
   - Config-driven: table name, form fields, validation, display renderer, optional scope filter, optional sort controls
   - Start with one page (Platforms is simplest at 219 lines), prove the pattern, then migrate others

2. **ORB-102: [Ticket] Permission Denied — Cannot access user** — investigate and triage

3. **ORB-94: Multi-todo query result set mismatch** — when asking for filtered subset, UI "Show list" displays all. May be partially addressed by the codes fix.

4. Review remaining open Orb tickets from the Friction Queue.

---

## AI Tool Used Last Session

`2026-05-15 — Claude Code (Anthropic Claude Opus 4.6)`

---

*Updated by AI at end of each session. Committed with session code changes.*
