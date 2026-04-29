# TODOS Handoff — Apr 28

## INCLUDE THIS SECTION WITH ALL HANDOFFS

My name is Stan. Read this file completely. When you are done answer the following questions:

1. Describe the project you and I are going to work on.
2. What is the versioning approach?
3. What are the working rules?
4. What is the most important rule?
5. Describe the use of AI and the typical workflow.
6. Display the git command string example used for production pushes.
7. What is our next task(s)?

### Versioning Rules
- **First two nodes** (0.2.x): Only incremented by Stan's direction
- **Third node** (0.2.5): Automatically incremented by AI for each code change
- **Format**: `major.minor.patch` where patch is auto-incremented

---

## Project

**TODOS** — personal project backlog tracker (Next.js App Router, Supabase, Vercel, TypeScript, Tailwind v4).
Used to manage backlogs across all Stan's projects, including Helm itself.

**GitHub:** `sbaptista/todos`
**Live:** `https://vercel.com/sbaptistas-projects/todos/`
**Version:** `package.json` version field (currently `0.2.10`)
**Dev Port:** `3001`

---

## Current Version

`0.2.5` — local

---

## Git Production Pushes

To push a production release use this pattern:

```
git add -A && git commit -m "feat: description of changes" && git push
```

---

## Section Status

| Section | Status | Notes |
|---|---|---|
| Products | ✅ Functional | CRUD on dashboard |
| Todo list | ✅ Functional | Per-product filtering |
| Priority dropdown | ✅ Functional | DB-driven from priorities table |
| Todo reference | ✅ Functional | `[CODE]-[todo_number]` display (e.g. HELM-3) |
| Groups | ✅ Functional | Managed in settings |
| Categories | ✅ Functional | Managed in settings |
| Platforms | ✅ Functional | Managed in settings |
| Settings | ✅ Functional | Account + Data only |

---

## Open Issues

None known.

---

## Next Session

None specified. Awaiting Stan's direction.

---

## Key Technical Notes

- **Dev port:** 3001 (package.json: `"dev": "next dev -p 3001"`)
- **Supabase client import:** `@/lib/supabase/client`
- **Form fields:** initialize to `''` not `null`
- **API payload:** explicitly list columns, never spread form objects
- **Magic link redirect:** `process.env.NEXT_PUBLIC_SITE_URL` + `/auth/callback`
- **Todo reference:** stored as `code` (product) + `todo_number` (todo), displayed as `${code}-${todo_number}`

---

## Handoff Location

**All handoff files written to:** `~/Downloads/`

---

## Session Transaction Log

### Apr 1
- See work/20260401-130000-session-log.md
- See work/20260401-143204-session-log.md
- See work/20260401-151145-session-log.md

### Apr 15a
- See TODOS_Handoff_Apr15a.md

### Apr 28 (this session)
- Permissions exploration: Added opencode.json permission config (edit/bash → ask)
- Desktop app did not prompt for permissions — feature not working as expected in desktop UI
- Handoff written to Downloads folder
- Redesigned login flow: magic link → email OTP (8-digit code)
  - Login page: sends OTP via signInWithOtp() with shouldCreateUser: false
  - New verify-otp page: 8-digit code input with professional Tailwind design
  - Updated Supabase email template to use {{ .Token }} instead of {{ .ConfirmationURL }}
  - Bumped version to 0.2.10 (third node auto-incremented)
  - Login and verify-otp pages redesigned with zinc theme, rounded-2xl cards, emerald/red alerts
  - Added developer bypass for localhost testing:
    - Login: email "dev@localhost" skips OTP sending, goes directly to dashboard
    - OTP: code "87654321" bypasses verification on localhost
  - Fixed hydration errors by using isClient state instead of typeof window in JSX
  - Yellow "Dev mode" hints appear on both pages when on localhost
  - All pages use consistent Tailwind v4 styling with zinc color scheme