---
name: mr-context
description: Senior engineering context for this repo (Psicologic, Astro app). Load at the start of ANY task in this repo — gives the repo map, non-negotiable rules, and the senior quality bar before touching code.
metadata:
  audience: all-developers
  workflow: team
---

# Context — Senior Bar for This Repo

Load this before starting any task here. It gives orientation and the
quality bar. It does NOT replace the rules — `AGENTS.md` is the rule manager.

## Repo map (30 seconds)

```
Psicologic — ONE Astro 5 SSR app at the repo root (NOT a monorepo).
src/pages/       54 .astro routes + api/ (44 TypeScript API routes)
src/components/  48 React 19 islands (Agenda + WebRTC VideoRoom, Dashboard,
                games, Payment, Admin, Chat…)
src/lib/turso/  TursoDB access (@libsql/client) — the only DB pattern
src/middleware.ts  Clerk route protection by role
public/js/       vanilla JS islands (dashboard, games, settings)
```

Stack: Astro 5 (SSR, Vercel) + React 19 islands + Tailwind CSS 4 + Clerk +
TursoDB (LibSQL) + MercadoPago/Bold + MailerSend + Playwright.

Deploy: Vercel from `productive`. Integration: `development` (PRs here).
`main` is an unused stub.

NOT in this repo: no mobile (RN/Flutter/Expo), no Go API, no Next.js, no
`packages/`. `apps/rules/` is a template corpus from another product —
principles only, never a technical source of truth.

## Non-negotiables (violating any of these = rework)

1. **Every API route validates Clerk auth** (existing pattern:
   `verifyClerkUser` + middleware role matcher) and input validators.
2. **Never work on `productive`** (deploy branch — merge only, never push).
   One branch = one worktree:
   `scripts/worktree.sh new feature/<name>` (base `origin/development`).
3. **Read the real code before changing it.** AGENTS.md + the zone you
   touch. No guessing, no inventing structure.
4. **DB via the `src/lib/turso/` pattern.** Never scatter libsql clients.
5. **Conventional commits, atomic, no AI attribution.**
6. **Patient data is sensitive:** never logged, never leaked in API
   responses, never copied into specs or docs.

## Senior quality bar (how to think here)

- **Verify before you claim.** Read the actual code/files — never assume what
  a file contains or that a named function does what its name suggests.
- **Root cause over symptom.** If a bug surprises you, stop patching and find
  WHY. A fix that doesn't explain the bug is not a fix.
- **Scope discipline.** Fix what was asked. Adjacent problems get reported,
  not silently fixed. Say what you deliberately did NOT touch.
- **Small and reviewable.** ~100 lines per commit/PR target. Split before
  submitting, not after.
- **Push back with alternatives.** If the ask is wrong, underspecified, or
  skips architecture, say so BEFORE coding — with the tradeoff, not just "no".
- **Tests prove behavior.** New logic = tests. Existing behavior changed =
  tests updated in the same commit.
- **Every task ends with:** build green (`pnpm build` + `build:style`),
  relevant playwright checks, and a CHANGES MADE summary (what changed,
  what intentionally untouched, concerns).

## Task flow

Entry point: `pipeline-init` skill (loads this + herdr context). Then:

```
1. Worktree: scripts/worktree.sh new feature/<name>
2. Pick skills by change type (map in AGENTS.md)
3. Feature? Spec first: docs/superpowers/specs/ (template: TEMPLATE-coach-feature.md)
4. Implement — small slices, commit each
5. Verify: pnpm build + build:style (+ playwright when it applies)
6. PR to development → clean up worktree
```

Full workflow detail: `apps/rules/14-team-workflow.md`.
