# Test Suite Quick Reference

## Current state (Oct 2026)

The testable surface today: the workflow scaffold (integrity checks below)
and Playwright E2E for the Astro app (`tests/` — currently one example spec;
coverage grows per feature slice). App builds run in CI on `productive`
(deploy); `development` pushes run the scaffold check.

## Local Commands

```bash
# Scaffold integrity — what CI runs (works today)
scripts/check-scaffold.sh        # or: make scaffold-check

# App (needs .env with Clerk + Turso keys — copy from .env.example)
pnpm dev                         # dev server
pnpm build                       # production build
pnpm build:style                 # tailwind: global.css → public/css/main.css

# E2E
npx playwright test              # headless
npx playwright test --headed     # watch it run
npx playwright codegen           # record new flows
```

## CI Pipelines (`.github/workflows/`)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | push/PR to `development` | `scripts/check-scaffold.sh` + shellcheck on workflow scripts |
| `deploy-vercel.yml` | push/PR to `productive` | Builds the Astro app and deploys to Vercel |

## Pre-commit Hook (`.githooks/pre-commit`)

Installs once per clone (`make install-hooks`). Blocks commits that stage:

- build artifacts: `dist/`, `.astro/`, `.DS_Store`
- secrets: `.env*` (except `.env.example`), `*.pem`, `e2e/credentials.env`
- any file larger than 1 MB

## E2E Requirements

Playwright tests need the dev server running (`pnpm dev`, Astro default
port 4321) and Clerk test users with valid roles in the `usuarios` table.

## Emergency bypass (use sparingly)

```bash
git commit --no-verify -m "emergency fix"   # skip pre-commit (NOT recommended)
git push --no-verify                        # skip CI on push (NOT recommended)
```

## Rule Enforcement

**NEVER push without the relevant checks passing.** A slice that changes
behavior ships with its test in the same PR. Do not disable a check to merge —
fix the failure.
