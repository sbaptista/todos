# TODOS Handoff — Apr15a

## Working Rules
0. **Never build without Stan's explicit go-ahead.**
1. **Plan first. Wait for confirmation. Then build.**
2. **Never propose a plan and immediately build in the same response.**
3. **Stan sets the pace.**
4. **Schema-first.** Query `information_schema.columns` before writing any insert code.
5. **Every git push gets a version bump — no exceptions.**
6. **Handoff is generated silently via present_files. No narration.**
7. **Localhost-first development** *(target state; local auth constraints currently in flux — verify with Stan at session start before assuming localhost testing is frictionless).* When operational: all implementation and testing on `localhost:3000`. Version bumps happen continuously as changes are made. Git pushes only when Stan decides enough changes have accumulated.

---

## AI Roles

**Role definitions are fixed. Tools are interchangeable.**

| Role | Responsibility | Example Tools |
|---|---|---|
| **AI1** | Architecture · Design · Planning · Handoff maintenance · Instruction authoring | Claude, Perplexity, Gemini |
| **AI2** | Code implementation · Local file access · Validation · Report-back | Claude Code, Cursor, Aider, Cline, local agents |

**Critical rule:** AI1 must not slip into implementation without an explicit role switch declared in the chat. If one AI is performing both roles in a session, it must ask Stan at session start how roles are assigned, and must not self-promote from AI1 to AI2 behavior silently.

---

## AI2 Capability Profile

**Active AI2 Tool:** `Claude Code (claude-opus-4-6)` ← *update if AI2 changes*

### Capability Tier
- **Tier A — Strong agentic implementer:** Can search the repo from vague descriptions, edit multiple files, run terminal commands, infer missing steps, and explain deviations from instructions.
- **Tier B — Competent but narrower implementer:** Can edit files and run some local commands, but benefits from probable file paths, named components/functions, and explicit verification steps.
- **Tier C — Limited implementer:** Best with exact file paths, exact edits, and tightly scoped tasks. Minimal autonomy. May not reliably discover files or derive improvements.

**Current Tier:** `A` ← *update if AI2 changes*

### Operational Capabilities (Claude Code defaults — update if AI2 changes)
- **Repo/file access:** direct local repo access
- **Can search for files by description:** yes
- **Can edit multiple files in one pass:** yes
- **Can run terminal commands:** yes
- **Can run lint/build/tests:** yes
- **Can inspect browser/localhost output:** limited
- **Can use git locally:** status only (Stan does git push)
- **Can make autonomous improvements if better than instructions:** yes, must report
- **Expected report-back quality:** high

### Instruction Style (Tier A)
AI1 may use goal-oriented instructions such as "find the component that does X and modify it," while still specifying constraints and required reporting. Avoid over-specifying file paths — let AI2 locate them. Do specify acceptance criteria and any non-obvious constraints.

**AI1 must declare the active tier at the top of every AI2 instruction document:**
> *AI2 Capability Tier for this task: Tier A (Claude Code)*

### Mandatory AI2 Reporting Contract
AI2 must report back:
1. What files were inspected.
2. What files were changed.
3. Any instruction deviations and why.
4. Any better solution chosen than the original instruction.
5. What verification was performed (`npm run build`, lint, localhost check, etc.).
6. Any unresolved concerns or follow-up recommendations.

---

## Workflow
1. AI1 collaborates with Stan to make project decisions, including software architecture and design.
2. AI1 proposes solutions that Stan must approve.
3. Upon approval, AI1 generates implementation instructions for AI2.
4. AI1 tailors those instructions to the active AI2 Capability Profile and declares the tier at the top of the instruction document.
5. AI2 implements the instructions and generates results, which Stan copies and returns to AI1.
6. If AI2 discovers a better implementation path, it may use it **only if** it clearly reports the deviation and rationale.

**Notes:**
- AI1 provides SQL instructions to Stan, who runs them in Supabase and returns the results.
- AI1 maintains a log of session activity.
- AI1 generates a handoff file at Stan's request using the logged activity.
- Tool rotation is normal and expected. Update the AI2 Capability Profile block whenever the active AI2 tool changes — mid-session or between sessions.
- If the AI2 tool changes mid-session, update the profile before issuing the next instruction set.

---

## Project

**TODOS** — personal project backlog tracker (Next.js App Router, Supabase, Vercel, TypeScript, Tailwind v4).
Same architectural stack as Helm. Used by Stan to manage backlogs across all his projects, including Helm itself.

**GitHub:** `[fill in]`
**Live:** `[fill in]`
**Version file:** `lib/version.ts` — format `MM.mm.nnnn`
**Supabase client import path:** `@/lib/supabase/client`

---

## Current Version
`[fill in]` — `[localhost status / build status]`

---

## Feature Status

| Feature | Status | Notes |
|---|---|---|
| Products dashboard | ✅ Functional | Products managed here |
| Todo list view | ✅ Functional | Per-product |
| Priority system | ✅ Functional | Urgent / High / Medium / Low |
| Todo reference format | ✅ Functional | `[PRODUCT_CODE]-[todo_number]`, DB-driven auto-increment |
| Groups / Categories / Platforms | ✅ Functional | Managed within each product's todo view |
| Settings | ✅ Functional | Account and Data only |

*Update this table at session start if status has changed.*

---

## Open Issues

| # | Area | Issue | Status |
|---|---|---|---|
| — | — | No known open issues at handoff creation | — |

*Populate as issues are discovered.*

---

## Next Session
*(To be filled in by AI1 at close of each session.)*

---

## Session Transaction Log

### Apr 15a (this session — handoff creation only)
- No build work performed.
- This handoff created to establish TODOS as the lower-risk validation sandbox for the revised multi-AI workflow.
- Workflow refinements applied from joint Claude + Perplexity commentary: role clarity rule, localhost target-state label, pre-filled AI2 profile, tier declaration requirement.
- Stan will hand this document to Perplexity as AI1 for TODOS.

---

## Key Technical Notes

### General
- API routes: service role client for data, SSR client for auth only.
- Form fields must always initialize to `''` not `null` for controlled inputs.
- Payload to API must explicitly list only valid DB columns — never spread the whole form object.
- **TypeScript strictness:** production build catches type errors dev mode ignores. Watch Vercel build logs after any props/interface changes.
- **Magic link redirect:** `process.env.NEXT_PUBLIC_SITE_URL` + `/auth/callback`.
- **Supabase client import:** `@/lib/supabase/client`.

*This section will grow as TODOS-specific patterns are established. When it becomes unwieldy, split into a separate TODOS Technical Reference document.*
