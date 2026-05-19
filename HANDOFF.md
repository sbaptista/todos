# HANDOFF.md

> Living session-to-session context for the Orb project.  
> Every AI reads this at session start. Every AI updates it at session end.  
> Committed with each session's code changes. No Downloads exports needed.


## App State

- **Version:** v0.4.84 (canonical in [package.json](file:///Users/stanleybaptista/Projects/orb/package.json))
- **Branch:** main
- **Dev server:** user-started on localhost:3001
- **Live URL:** https://orb-eight-lake.vercel.app

---

## Last Session Completed

**ORB-112, ORB-110, ORB-114, ORB-115, ORB-113 (partial) — 2026-05-18/19**

Massive multi-session push covering 5 tickets. All committed and pushed as v0.4.84.

### ORB-112 — Fix multiple sources of truth (CLOSED)
- Removed silent scoping from `query_todos`
- Scope transparency mandatory block in system prompt
- Every Orb response declares what scope its numbers come from

### Scope transparency + "active" → "open" rename
- Replaced constructed "active" status with "open" everywhere
- `lib/insights.ts`: split into `nonClosedTodos` + `openTodos` + `parkedTodos`

### ORB-110 — Project dormancy (CLOSED)
- Migration: `is_dormant boolean` column on `projects`
- `lib/projects.ts`: `visibleProjectsQuery()` — single source of truth for dormancy filtering
- `lib/orb-contract.ts`: new `set_dormancy` tool
- Settings UI: dormancy checkbox, dormant rows at 50% opacity
- Projects tab visible to all users

### ORB-114 — Remove ORBFDBK and is_shared (CLOSED)
- Migration: deleted ORBFDBK project, recreated RLS policies without `is_shared`, dropped column
- Updated invite email to reference ticketing instead of ORBFDBK

### ORB-115 — Network loss handling (CLOSED)
- `components/ui/OfflineBanner.tsx`: global offline banner in root layout
- Auth pages (login, verify-otp, create-account): navigator.onLine pre-check + try/catch

### ORB-113 — Move tasks between projects + auth consolidation (IN PROGRESS)
- **Auth consolidation:** Centralized all authorization into `getAuthContext()` / `requireAdmin()` in `lib/auth.ts`. Refactored ~15 server actions. Eliminated 6 scattered auth mechanisms.
- **canWrite gate removed:** Non-admins can now create, update, delete, and move their own todos through the Orb (RLS enforces ownership).
- **move_todo tool:** Added to Orb contract and `orb-converse.ts`. Parses code, finds target project, assigns new `todo_number` via MAX+1.
- **REST API:** PATCH handler accepts `product_code` to move tasks between projects.
- **Data leakage fix:** Application-level audit filtering (`todoIds.has(a.record_id)`) prevents non-admins from seeing other users' audit data.
- **orb-converse.ts fully refactored:** Both `orbConverse` and `orbGreeting` use `getAuthContext()`. All tool handlers use `auth.admin` instead of `createAdminClient()`. Both `createClient` and `createAdminClient` imports removed.
- **Migrations run:** `20260518_project_dormancy.sql` and `20260518_remove_shared_projects.sql` executed.
- **Needs testing** — see test plan below.

---

## Test Plan (ORB-113)

### Domain 1: Non-admin via Orb
Log in as non-admin who owns 2+ projects with tasks.
1. "Create a todo called Test in [PROJECT]" → succeeds
2. "Move [PROJECT]-X to [OTHER_PROJECT]" → succeeds, new number
3. "Delete [PROJECT]-X" → succeeds
4. "Move [PROJECT]-X to ORB" → RLS error (don't own ORB)
5. Greeting on login → counts match only their own tasks

### Domain 2: Admin via Orb
6. "Move ORB-113 to HELM" → succeeds
7. "Move HELM-XX back to ORB" → succeeds
8. "Move ORB-113 to ORB" → error: already in that project
9. "Move ORB-999 to HELM" → error: todo not found
10. "Move ORB-113 to ZZZZ" → error: project not found

### Domain 3: REST API
11. POST + PATCH with product_code + verify + DELETE (curl)

### Regression: Data leakage
12. Non-admin greeting → only their own task counts
13. Non-admin audit trail query → only their own events

---

## Uncommitted Changes

None — all committed in v0.4.84.

---

## Key Decisions

*   **Email is the stable identity, not auth UUID.** Supabase can replace auth UUIDs on invite/re-invite.
*   **Atomic ID reconciliation via Postgres function.** Supabase JS client can't do multi-statement transactions.
*   **Lazy SDK initialization in server actions.** Module-scope SDK constructors crash Vercel function chunks.
*   **Insight engine is zero-cost.** Pure computation on server — no AI calls.
*   **Conversational tuning over settings UI.** User tells the Orb scope preferences, AI respects them.
*   **Single source of truth for dormancy filtering.** `visibleProjectsQuery()` in `lib/projects.ts`.
*   **"Open" not "active".** Replaced misleading "active" (included on-hold/deferred) with "open".
*   **Database is the source of truth — period.** No silent scoping, no in-memory divergence.
*   **Single auth authority.** `getAuthContext()` / `requireAdmin()` in `lib/auth.ts` is the only path. Exceptions: `complete-onboarding.ts` (bootstrap), `friction-actions.ts` / `ticket-actions.ts` (system-level), REST API routes (shared secret).
*   **RLS is the safety net.** Regular Supabase client for user operations, admin client only for intentional cross-user access.

---

## Next Priorities

1. **Test ORB-113** — Run the test plan above against the live deploy.
2. **Close ORB-113** — Write resolution notes + knowledge repo entry after tests pass.
3. **Fix RLS on audit_log** — Database-level fix (app-level filter is a stopgap). SELECT policy currently checks "is a user" not "owns this data".
4. **ORB-116** — Build Helm-style offline page to replace OfflineBanner.
5. **ORB-109** — Session persistence.

---

## AI Tool Used Last Session

`2026-05-19 — Claude Code (claude-opus-4-6)`

---

*Updated by AI at end of each session. Committed with session code changes.*
