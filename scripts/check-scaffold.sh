#!/usr/bin/env bash
# check-scaffold.sh — integrity checks for the agent/workflow scaffold.
# Runs in CI (.github/workflows/ci.yml) and locally. Read-only.
set -uo pipefail

fail=0
ok()  { echo "  ok: $1"; }
bad() { echo "  FAIL: $1" >&2; fail=1; }

echo "[1/5] Required scaffold and app files"
for f in \
  AGENTS.md BOARD.md Makefile TESTING.md opencode.json \
  scripts/worktree.sh .githooks/pre-commit \
  docs/superpowers/specs/TEMPLATE-coach-feature.md \
  .github/workflows/ci.yml .github/workflows/deploy-vercel.yml \
  playwright.config.ts src/middleware.ts src/lib/turso/client.ts \
  src/lib/payments/save-payment.ts \
  src/pages/index.astro src/styles/global.css \
  .agents/skills/pipeline-init/SKILL.md .agents/skills/mr-context/SKILL.md \
  .agents/skills/astro/SKILL.md; do
  if [ -e "$f" ]; then ok "$f"; else bad "missing: $f"; fi
done
if [ -x scripts/worktree.sh ]; then ok "scripts/worktree.sh is executable"; else bad "scripts/worktree.sh is NOT executable"; fi

echo "[2/5] Rule corpus (apps/rules — rewritten for this app)"
for f in apps/rules/*.md; do
  if [ -e "$f" ]; then ok "$f"; else bad "missing: $f"; fi
done
[ "$(find apps/rules -maxdepth 1 -name '*.md' | wc -l)" -ge 14 ] || bad "apps/rules must have >= 14 rule files"
if [ -d apps/rules/mobile-rules ]; then bad "apps/rules/mobile-rules should not exist (no mobile app)"; else ok "no mobile-rules (correctly removed)"; fi

echo "[3/5] .github/workflows must be a directory"
if [ -d .github/workflows ]; then ok ".github/workflows is a directory"; else bad ".github/workflows must be a directory (regression: it was once a misnamed file)"; fi
if ls .github/workflows/*.yml >/dev/null 2>&1; then ok "workflow files present"; else bad "no .yml workflows found in .github/workflows/"; fi

echo "[4/5] Key references in AGENTS.md resolve to real files"
refs="$(grep -oE 'src/(pages|components|lib|utils|styles)[A-Za-z0-9._/-]*' AGENTS.md | sort -u)"
for ref in $refs; do
  if [ -e "$ref" ]; then ok "$ref"; else bad "AGENTS.md references missing path: $ref"; fi
done

echo "[5/5] No misnamed workflows file"
if [ -f .github/workflows ]; then bad ".github/workflows exists as a FILE — workflows will never run"; else ok "no file shadowing .github/workflows/"; fi

if [ "$fail" -ne 0 ]; then
  echo "SCAFFOLD CHECK: FAILED" >&2
  exit 1
fi
echo "SCAFFOLD CHECK: PASSED"
