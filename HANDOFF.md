# HANDOFF.md

> Living session-to-session context for the Orb project.  
> Every AI reads this at session start. Every AI updates it at session end.  
> Committed with each session's code changes. No Downloads exports needed.


## App State

- **Version:** v0.4.52
- **Branch:** main
- **Dev server:** user-started on localhost:3001
- **Live URL:** https://orb-eight-lake.vercel.app

---

## Last Session Completed

**Ticketing system, audit trail tool, Orb integrity rules, UX improvements — v0.4.46 → v0.4.52**

### Ticketing System (replaces friction logging)
- Migration: `scripts/migrations/20260514_tickets.sql` — `tickets` table with RLS, migrated `orb_friction` data.
- Server actions: `app/actions/ticket-actions.ts` — create, get, convert-to-todo, dismiss, delete (individual + bulk).
- Settings UI: `components/settings/SettingsTickets.tsx` — full table with checkbox selection, filter tabs, expandable detail, convert-to-todo with project picker, bulk dismiss/delete with confirm.
- Orb integration: `create_ticket` tool replaces `report_friction` — Orb files tickets silently.

### Orb Integrity Rules Rewrite
- Rewrote from 4 generic rules to 8 failure-class-specific rules in `lib/orb-contract.ts`.
- Covers: backlog-as-snapshot-only, verify-before-asserting, max_results matching, uncertainty acknowledgment, capability gap logging.

### Audit Trail Tool (ORB-87 Item 5)
- `query_audit_trail` tool added to `lib/orb-contract.ts`, handler in `app/actions/orb-converse.ts`, spec in `docs/api-spec.yaml`.
- Orb can answer "who closed this?", "what changed last week?" by querying `audit_log` table.

### UX Improvements
- Orb long-press to return to quiet state from active conversation (AmbientDashboard.tsx).
- Send button redesigned: paper plane SVG, `.oc-send-btn` class.
- Phone font bump: media query scales up all `--fs-*` variables on touch devices ≤767px (e.g. `--fs-sm` 13→15px).

### Infrastructure
- **psql installed:** `/opt/homebrew/opt/libpq/bin/psql` via `libpq`. Migrations can now be run directly via `DATABASE_URL` in `.env.local`.
- **Direct SQL access** section added to AGENTS.md.
- **Worktree patching** documented in AGENTS.md.

### Backlog Changes
- **ORB-87 closed** — resolution notes cover all 3 phases (context injection, integrity rules, audit trail).
- **ORB-92 opened** — Task relationships and dependencies (from ORB-87 item 4).
- **ORB-93 opened** — Custom fields for tasks (from ORB-87 item 6).

---

## Uncommitted Changes

All changes from v0.4.46 through v0.4.52 in the main working directory:

- `.claude/settings.local.json`
- `AGENTS.md` — worktree patching docs, direct SQL access section
- `app/actions/orb-converse.ts` — query_audit_trail handler, create_ticket handler, backlog status tags
- `app/actions/ticket-actions.ts` — NEW
- `app/globals.css` — send button styles, phone font bump media query
- `app/settings/tickets/page.tsx` — NEW
- `components/AmbientDashboard.tsx` — long-press to quiet state
- `components/OrbConversation.tsx` — send button redesign
- `components/settings/SettingsSidebar.tsx` — friction → tickets nav
- `components/settings/SettingsTickets.tsx` — NEW
- `docs/api-spec.yaml` — query_audit_trail, create_ticket, integrity rules
- `lib/orb-contract.ts` — query_audit_trail tool, create_ticket tool, integrity rules rewrite
- `lib/version.ts` — v0.4.52
- `package.json` — v0.4.52
- `scripts/migrations/20260514_tickets.sql` — NEW

---

## Key Decisions

- **Two-layer security model:** RLS for dashboard (owner-only at DB level), server actions for Settings (role-based admin access via `createAdminClient()`).
- **Ticketing replaces friction logging.** System-wide scope, Orb files silently, admin-only visibility in Settings → Tickets.
- **Integrity rules address failure classes, not individual bugs.**
- **Git commands from Claude Code fail.** Always provide commit/push commands for Stan to run manually.
- **Phone font scaling** uses CSS variable overrides in a media query — no individual class changes needed.

---

## Next Priorities

1. **Test mobile font scaling on iPhone** — verify phone font bump, adjust if needed.
2. **Production push** — commit and push all uncommitted changes.
3. **iPhone UI audit** — Stan wants to spend time on iPhone experience beyond fonts.
4. **ORB-92** — Task relationships/dependencies (low priority, future).
5. **ORB-93** — Custom fields (low priority, future).

---

## AI Tool Used Last Session

`2026-05-14 — Claude Code (Anthropic Claude Opus 4.6)`

---

*Updated by AI at end of each session. Committed with session code changes.*
