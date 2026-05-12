# HANDOFF.md

> Living session-to-session context for the Orb project.  
> Every AI reads this at session start. Every AI updates it at session end.  
> Committed with each session's code changes. No Downloads exports needed.


## App State

- **Version:** v0.4.24
- **Branch:** main
- **Dev server:** user-started on localhost:3001
- **Live URL:** https://orb-eight-lake.vercel.app

---

## Uncommitted Changes

- None (working tree clean)
- Untracked: `scripts/generate-orb-contract.ts`

---

## Last Session Completed

- Verified project state and updated version tracking to v0.4.24.
- Confirmed git working tree is clean.
- Resolved ORB-72: Fixed iOS Safari layout bugs in AmbientDashboard (squashed buttons, project strip overlap, and width mismatches) using strict dimensions and absolute positioning relative to the dynamic viewport.

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