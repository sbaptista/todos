# HANDOFF.md

> Living session-to-session context for the Orb project.  
> Every AI reads this at session start. Every AI updates it at session end.  
> Committed with each session's code changes. No Downloads exports needed.


## App State

- **Version:** v0.4.22
- **Branch:** main
- **Dev server:** user-started on localhost:3001
- **Live URL:** https://orb-eight-lake.vercel.app

---

## Uncommitted Changes

- `lib/auth.ts` — `assertAdmin()` / `getSessionRole()` use admin client for user lookup
- `app/actions/manage-project.ts` — NEW: server actions for project CRUD
- `app/actions/list-users.ts` — NEW: server action to list all users (admin-only)
- `components/AddProductModal.tsx` — uses server actions instead of browser client
- `components/AmbientDashboard.tsx` — owner dropdown uses `listUsers` action
- `components/settings/SettingsUsers.tsx` — uses `listUsers` action
- `app/dashboard/page.tsx` — isAdmin check fixed to `1 || 3`

---

## Last Session Completed

- **Superadmin project creation fix (ORB-85 resolved)**
  - Root cause: `assertAdmin()` used browser client, hitting RLS `users: select own` policy
  - Fix: `assertAdmin()` and `getSessionRole()` now use `createAdminClient()` (service role, bypasses RLS)
  - Role_id checks restored to `[1, 3]` (were incorrectly changed to `[0, 1]`)
- **Project CRUD moved to server actions** (`app/actions/manage-project.ts`)
- **Users list fix** — new `app/actions/list-users.ts` using admin client

---

## Key Lesson (Last Session)

`roles` table: `id` is the FK used in `users.role_id`. `value` is sort/display only.  
Super Admin = id 3. Admin = id 1. Owner = id 2. **Never use `value` as role identifier.**

---

## Next Priorities

1. ORB-72 — Buttons squashed on iPad/iPhone (needs vision-capable model)
2. Push uncommitted changes to git when Stan decides enough has accumulated
3. TBD — fetch live backlog at session start

---

## Open Backlog (fetch live)

```bash
curl -s "https://orb-eight-lake.vercel.app/api/tasks?product=ORB&status=open" -H "Authorization: $(grep ORB_API_SECRET /Users/stanleybaptista/Projects/orb/.env.local | cut -d= -f2)"
```

---

## AI Tool Used Last Session

`2026-05-10 — Claude Code (claude-sonnet-4-6)`

---

*Updated by AI at end of each session. Committed with session code changes.*