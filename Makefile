# Psicologic — dev & test commands (real app: Astro SSR + React islands)

.PHONY: dev build build-style watch-style preview test test-headed install-hooks scaffold-check ci-local

dev:
	pnpm dev

build-style:
	pnpm build:style

watch-style:
	pnpm watch:style

build: build-style
	pnpm build

preview:
	pnpm preview

test:
	npx playwright test

test-headed:
	npx playwright test --headed

install-hooks:
	@echo "📦 Installing git hooks..."
	cp .githooks/pre-commit .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "✅ Hooks installed"

scaffold-check:
	bash scripts/check-scaffold.sh

# Full CI simulation locally
ci-local: scaffold-check test
	@echo "🎉 Local CI simulation complete!"
