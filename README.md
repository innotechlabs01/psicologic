# MR Training — The Operating System for Sports Coaching

MR Training is a premium SaaS platform that unifies the entire ecosystem of athletic development — coaches, athletes, academies, sports clubs, nutritionists, and physical therapists — into one seamless experience.

## Current state (Oct 2026)

This repo is mid-migration from **Psicologic** (the legacy Astro app, still
in `src/` and `public/`) to the MR Training monorepo. Today only `apps/rules/`
(the rule corpus) exists; `apps/web`, `apps/api` and `apps/mobile` are pending.
Production deploys from the `productive` branch (Vercel); integration happens
on `development` (PRs go there; `main` is an unused stub).

## Architecture (target)

```
apps/
├── rules/        # Product + engineering rule corpus — EXISTS today
├── web/          # Next.js 14 (App Router) frontend — pending
├── api/          # Go (Fiber) backend API — pending
└── mobile/       # React Native app (iOS + Android) — pending

packages/         # Empty by design — see apps/rules/14-team-workflow.md §4
```

## Technology Stack

The operative stack (matches AGENTS.md and apps/rules/mobile-rules/):

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js 14 (App Router), React 18, TypeScript strict, Tailwind CSS 3, shadcn/ui |
| Mobile | React Native CLI, TypeScript strict, React Navigation, React Query, Expo dev client |
| Backend API | Go 1.25 (Fiber) — single source of truth for data |
| Database | Turso/LibSQL (primary), Redis 7 (cache) |
| Event Bus | NATS 2.10 with JetStream |
| Auth | Clerk v6 (organization-aware) |
| Monorepo | pnpm workspaces |

> Note: `apps/rules/04-database-design.md` and
> `apps/rules/07-mobile-architecture.md` still describe the original product
> spec (PostgreSQL + Flutter). Aligning the full rule corpus with the
> operative stack above is a pending team decision — until then, AGENTS.md
> and mobile-rules/ are the operative truth for agents.

## Documentation

| Document | Description |
|----------|------------|
| [MASTER_PROMPT.md](./apps/rules/MASTER_PROMPT.md) | Architectural constitution — principles, philosophy, rules |
| [00-product-vision.md](./apps/rules/00-product-vision.md) | Product vision, personas, modules, roadmap, business model |
| [01-brand-guidelines.md](./apps/rules/01-brand-guidelines.md) | Brand identity, colors, typography, voice & tone, motion |
| [02-design-system.md](./apps/rules/02-design-system.md) | Design tokens, layout, components, dark mode, responsive |
| [03-ux-workflows.md](./apps/rules/03-ux-workflows.md) | UX principles, onboarding, coach/athlete/admin workflows, AI flows |
| [04-database-design.md](./apps/rules/04-database-design.md) | Database schema, indexing, partitioning, migration strategy (original spec: PostgreSQL) |
| [05-backend-architecture.md](./apps/rules/05-backend-architecture.md) | Go Clean Architecture, DDD, CQRS, event-driven patterns |
| [06-frontend-architecture.md](./apps/rules/06-frontend-architecture.md) | Next.js App Router, Server Components, state management, testing |
| [07-mobile-architecture.md](./apps/rules/07-mobile-architecture.md) | Mobile architecture (original spec: Flutter — see stack note) |
| [08-api-specification.md](./apps/rules/08-api-specification.md) | RESTful API design, endpoints, webhooks, rate limiting, SDK |
| [09-ai-specification.md](./apps/rules/09-ai-specification.md) | AI/ML architecture, models, training pipelines, integration |
| [10-devops.md](./apps/rules/10-devops.md) | CI/CD, Docker, monitoring, infrastructure as code |
| [11-security.md](./apps/rules/11-security.md) | Security architecture, OWASP, data protection, compliance |
| [12-coding-standards.md](./apps/rules/12-coding-standards.md) | Coding conventions for TypeScript, Go, SQL |
| [13-testing.md](./apps/rules/13-testing.md) | Testing strategy, coverage targets, tools, patterns |
| [14-team-workflow.md](./apps/rules/14-team-workflow.md) | Multi-agent team workflow, worktrees, spec-first pipeline |
| [mobile-rules/](./apps/rules/mobile-rules/) | React Native rule pack (architecture, UI/UX, code, testing, security, performance, QA) |

## Quick Start

```bash
git clone https://github.com/innotechlabs01/psicologic.git
cd psicologic

# Agent workflow tooling (works today)
scripts/worktree.sh new feature/<name>   # one branch = one worktree (base: origin/development)
scripts/check-scaffold.sh                # scaffold integrity — what CI runs
make install-hooks                       # installs .githooks/pre-commit

# Root scripts
pnpm test          # jest (passes with no tests until suites exist)
pnpm scaffold:check
```

### Target commands (once each app exists)

```bash
# Web (apps/web)
pnpm dev           # = pnpm --filter @mrtraining/web dev
pnpm build
pnpm lint

# API (apps/api)
cd apps/api && go run cmd/api/main.go
cd apps/api && go test ./...

# Mobile (apps/mobile — React Native + Expo dev client)
pnpm dev:mobile    # cd apps/mobile && npm start
pnpm build:mobile  # eas build --profile development --platform ios
```

## Development Workflow

1. Understand the requirement
2. Design the workflow before the UI
3. Model the domain before the database
4. Define the API contract before implementation
5. Implement frontend and backend independently against the contract
6. Test at every layer
7. Review against Product Principles (see apps/rules/MASTER_PROMPT.md)
8. Deploy incrementally

## Contributing

See [12-coding-standards.md](./apps/rules/12-coding-standards.md) for code conventions and [13-testing.md](./apps/rules/13-testing.md) for testing requirements. All contributions must follow the development workflow documented in [MASTER_PROMPT.md](./apps/rules/MASTER_PROMPT.md).

## License

Proprietary. All rights reserved. MR Training Inc.
