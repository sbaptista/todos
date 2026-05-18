# HANDOFF.md

> Living session-to-session context for the Orb project.  
> Every AI reads this at session start. Every AI updates it at session end.  
> Committed with each session's code changes. No Downloads exports needed.


## App State

- **Version:** v0.4.82 (canonical in [package.json](file:///Users/stanleybaptista/Projects/orb/package.json))
- **Branch:** main
- **Dev server:** user-started on localhost:3001
- **Live URL:** https://orb-eight-lake.vercel.app

---

## Last Session Completed

**Proactive Insight Engine + Source-of-Truth Analysis — 2026-05-18**

### Built (pushed to production)
- **Insight Engine** (`lib/insights.ts`) — pure server-side computation (zero AI cost) analyzing todos + audit trail for 7 pattern types: stale tasks, priority overload, churn, focus gaps, velocity, neglected projects, stagnant urgent tasks
- **System prompt injection** — insights injected into Claude's system prompt alongside BACKLOG, with PROACTIVE BEHAVIOR and FEEDBACK TONE instruction blocks
- **Login greeting** (`orbGreeting()` in `orb-converse.ts`) — cross-project AI-generated observation on session start
- **Project switch summary** — client-side instant message with open/closed/priority/in-progress counts
- **Urgency transition** — explains mood changes within same project, suppressed during project switches
- **Classic Editor nav shortcut** (ORB-106) — verified and pushed from prior Antigravity session

### Fixed (this commit, v0.4.82)
- **ORB-111**: Insight engine was counting on-hold/deferred tasks as urgent. Introduced `activeTodos` (excludes parked statuses) for priority distribution, focus gap, and summary calculations. Parked count now shown in summary.

### Identified but NOT yet built
- **CRITICAL: Multiple sources of truth** — The system has three data paths that independently scope the same data and can contradict each other. See "Next Priorities" below.

---

## Uncommitted Changes

_(none — all committed this session)_

---

## Key Decisions

*   **Email is the stable identity, not auth UUID.** Supabase can replace auth UUIDs on invite/re-invite. All user lookups now go through `resolveUser()` which queries by email first.
*   **Atomic ID reconciliation via Postgres function.** Supabase JS client can't do multi-statement transactions, so FK migration uses a server-side `reconcile_user_id()` function called via `rpc()`.
*   **Shared project access is read+create for users, full access for admins.** Prevents invited users from modifying/deleting feedback they didn't create, while still allowing them to contribute.
*   **Lazy SDK initialization in server actions.** Module-scope SDK constructors crash Vercel function chunks when env vars are missing. Always use lazy getClient() pattern.
*   **Shared projects survive user deletion.** Reassigned to super admin in application code before CASCADE fires. Business rule kept in server action, not DB trigger.
*   **SettingsCrudList for complex tables only.** Statuses and Priorities (short fixed lists) don't need sorting/search/bulk — keep them simple.
*   **Insight engine is zero-cost.** Pure computation on server — no AI calls. Only the greeting uses a Claude call.
*   **Conversational tuning over settings UI.** User tells the Orb "only report on ORB" and AI respects it for the session. No config needed.

---

## Next Priorities

1.  **CRITICAL — Fix multiple sources of truth in `orb-converse.ts`**
    The Orb has three data paths that silently apply different scopes to the same database, causing contradictions:

    | Path | Scope | Location |
    |------|-------|----------|
    | BACKLOG (system prompt text) | Current project only (others show "not in scope") | `buildContext()` lines 82-91 |
    | INSIGHTS (insight engine) | All projects, always | `computeInsights()` gets full `todoList` at line 80 |
    | `query_todos` tool | Silently scoped to current project when no `product_code` passed | Lines 270-271 |

    **Example failure:** Greeting says "6 at P1/P2" (cross-project). User asks "show me". `query_todos` silently scopes to current project, returns 1. User sees contradiction.

    **Approved fix (3 changes):**
    1. **Remove silent scoping from `query_todos`** — delete the `else if (req.scopeToProduct)` block at lines 270-271. Let the Orb pass `product_code` explicitly.
    2. **Update SCOPE system prompt** — instruct the Orb to always pass `product_code` for project-scoped queries, and omit it when following up on cross-project insights.
    3. **Annotate INSIGHTS block** — add "(computed across all projects)" so the Orb knows the scope boundary.

    **User directive:** "The database has to be the source of truth. That can never happen. Period."

2.  **ORB-105 remaining items** — review if any sub-items remain after bulk edit decision.
3.  **Monitor production** — verify Settings pages and insight engine work correctly after deploy.

---

## AI Tool Used Last Session

`2026-05-18 — Claude Code (claude-opus-4-6)`

---

*Updated by AI at end of each session. Committed with session code changes.*
