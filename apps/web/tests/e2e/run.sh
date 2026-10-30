#!/usr/bin/env bash
# E2E smoke runner (stream: brief-to-board).
#
# Boots the unified runtime on :3100 with a throwaway sqlite database and
# the loopback mail capture, then runs the Playwright smoke spec against
# it. The database and the runtime are torn down on exit.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_root="$(cd "$here/../.." && pwd)"
repo_root="$(cd "$web_root/../.." && pwd)"

tmp="$(mktemp -d)"
port="${E2E_PORT:-3100}"

cleanup() {
  if [ -n "${api_pid:-}" ]; then
    kill "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
  fi
  rm -rf "$tmp"
}
trap cleanup EXIT

export DATABASE_URL="$tmp/smoke.db"
export NODE_ENV=development
export EMAIL_LOOPBACK_DOMAINS=tarima.test
export SESSION_SECRET=smoke-session-secret
export PORT="$port"
export BETA_ALLOWLIST=""
export TELEGRAM_BOT_TOKEN=""
export BREVO_API_KEY=""

# The runtime serves the built web app; build it once per run.
pnpm -C "$web_root" build

# The api serves the web SSR bundle from apps/api/src/web; the build
# script copies it there.
pnpm -C "$repo_root/apps/api" run build

node "$repo_root/apps/api/dist/server/index.mjs" &
api_pid=$!

for _ in $(seq 1 60); do
  if curl -fsS "http://localhost:$port/api/health" >/dev/null 2>&1; then break; fi
  sleep 0.5
done

E2E_BASE_URL="http://localhost:$port" pnpm -C "$web_root" exec playwright test
