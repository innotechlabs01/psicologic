# Test Suite Quick Reference

## Current state (Oct 2026)

`apps/api` (Go) and `apps/web` (Next.js) do not exist yet. What is testable
today: the workflow scaffold itself (integrity checks below) and the legacy
Astro app from the `productive` branch (old toolchain, old lockfile).

## Local Commands

```bash
# Scaffold integrity — what CI runs (works today)
scripts/check-scaffold.sh        # or: pnpm scaffold:check

# Go API tests (when apps/api exists)
cd apps/api && go test ./internal/... -v -race

# Web tests (when apps/web exists)
cd apps/web && pnpm test && pnpm lint && pnpm build

# E2E tests (when apps/web + apps/api exist; requires both dev servers)
cd apps/web && pnpm test:e2e
```

## CI Pipelines (`.github/workflows/`)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | push/PR to `development` | `scripts/check-scaffold.sh` + shellcheck on workflow scripts |
| `deploy-vercel.yml` | push/PR to `productive` | Builds the legacy Astro app and deploys to Vercel |

Target additions once the apps exist: `go-api-tests`, `web-tests`, and an
`all-tests-passed` merge gate (see `apps/rules/13-testing.md`).

## Pre-commit Hook (`.githooks/pre-commit`)

Installs once per clone (`make install-hooks`). Blocks commits that stage:

- build artifacts: `dist/`, `.astro/`, `.DS_Store`
- secrets: `.env*` (except `.env.example`), `*.pem`, `e2e/credentials.env`
- any file larger than 1 MB

## E2E Requirements (target state)

Playwright tests need the Go API on `localhost:8080`, the web app on
`localhost:3000`, and Clerk test users:

| Role | Email | Password |
|------|-------|----------|
| Coach | `coach@test.com` | `test123` |
| Athlete | `athlete@test.com` | `test123` |

Create them in Clerk Dashboard → Users.

## Emergency bypass (use sparingly)

```bash
# Skip pre-commit hook (NOT recommended)
git commit --no-verify -m "emergency fix"

# Skip CI on push (NOT recommended)
git push --no-verify
```

## Rule Enforcement

**NEVER push without tests passing.** When CI jobs exist for an app, a red
job blocks the merge. Do not disable a job to merge — fix the failure.
