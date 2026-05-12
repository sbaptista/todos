# HANDOFF.md

> Living session-to-session context for the Orb project.  
> Every AI reads this at session start. Every AI updates it at session end.  
> Committed with each session's code changes. No Downloads exports needed.


## App State

- **Version:** v0.4.27
- **Branch:** main
- **Dev server:** user-started on localhost:3001
- **Live URL:** https://orb-eight-lake.vercel.app

---

## Uncommitted Changes

- None (working tree clean)

---

## Last Session Completed

- Verified project state and updated version tracking to v0.4.27.
- Confirmed git working tree is clean.
- Resolved ORB-80 (Architectural Alignment): Transitioned `docs/api-spec.yaml` to be the single source of truth for the API and Orb. 
  - Added `x-orb-agent-contract` to hold system voice, valid values, and explicit integrity rules.
  - Added `x-orb-tool` extensions to map REST paths (`create_todo`, `update_todo`, `delete_todo`) to Anthropic tool schemas.
  - Added `x-orb-internal-tools` to manage native agent capabilities (`query_todos`, `report_friction`, etc.).
  - Built `scripts/generate-orb-contract.ts` to dynamically assemble `lib/orb-contract.ts`, applying parameter overrides and confidence metadata.
- Resolved ORB-89: Gave Orb direct write access to the Knowledge Repository.
  - Added `add_knowledge` internal tool to `api-spec.yaml` with explicit proactive-prompting instructions.
  - Implemented backend database insertion in `app/actions/orb-converse.ts`.

---

## Key Lesson (Last Session)

`roles` table: `id` is the FK used in `users.role_id`. `value` is sort/display only.  
Super Admin = id 3. Admin = id 1. Owner = id 2. **Never use `value` as role identifier.**
*iOS Safari Layout:* Use strict `minWidth/maxHeight` on buttons to override 44px touch targets. Use `position: absolute` instead of `position: fixed` when syncing with `100dvh` wrappers to prevent overlap with the bottom navigation bar.

---

## Next Priorities

1. Push uncommitted changes to git when Stan decides enough has accumulated
2. TBD — fetch live backlog at session start

---

## Open Backlog (fetch live)

```bash
curl -s "https://orb-eight-lake.vercel.app/api/tasks?product=ORB&status=open" -H "Authorization: $(grep ORB_API_SECRET /Users/stanleybaptista/Projects/orb/.env.local | cut -d= -f2)"
```

---

## AI Tool Used Last Session

`2026-05-12 — Antigravity (Gemini 3.1 Pro)`

---

*Updated by AI at end of each session. Committed with session code changes.*