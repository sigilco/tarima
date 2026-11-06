#!/usr/bin/env bash
# Memory e2e runner (batch dev-memory-e2e): boots the built web app with
# the deterministic stub LLM on a throwaway SQLite database, then runs
# the Playwright memory spec (tests/e2e/memory.spec.ts) against it.
#
# The spec needs the stub responder (TARIMA_AGENT_STUB=1) and dev-login;
# both are set here. The database and the server are torn down on exit.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_root="$(cd "$here/../.." && pwd)"
repo_root="$(cd "$web_root/../.." && pwd)"

tmp="$(mktemp -d)"
port="${E2E_PORT:-3100}"

server_pid=""
cleanup() {
  if [ -n "$server_pid" ]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -rf "$tmp"
}
trap cleanup EXIT

# The eve runtime (.output/) must be built next to the web build.
if [ ! -f "$web_root/.output/server/index.mjs" ]; then
  echo "[memory] building eve runtime (.output/)"
  (cd "$web_root" && node node_modules/eve/bin/eve.js build --skip-sandbox-prewarm)
fi

export DATABASE_URL="$tmp/memory.db"
export NODE_ENV=development
export DEV_LOGIN=1
export SESSION_SECRET=memory-e2e-session-secret
export PORT="$port"
export TARIMA_AGENT_STUB=1
export TARIMA_EVE_PORT="${TARIMA_EVE_PORT:-4319}"
export EMAIL_LOOPBACK_DOMAINS=tarima.test
export TELEGRAM_BOT_TOKEN=""
export BREVO_API_KEY=""

# The app must run from its web root so cwd-relative paths (.output/
# import) resolve.
cd "$web_root"
if [ ! -f dist/server/server/index.mjs ]; then
  echo "[memory] building web app (dist/)"
  pnpm --filter web build
fi
node dist/server/server/index.mjs >"$tmp/server.log" 2>&1 &
server_pid=$!

for _ in $(seq 1 120); do
  if curl -fsS "http://localhost:$port/api/health" >/dev/null 2>&1; then break; fi
  sleep 0.5
done
curl -fsS "http://localhost:$port/api/health" >/dev/null || { echo "[memory] server never became healthy"; cat "$tmp/server.log"; exit 1; }
echo "[memory] server healthy on :$port"

E2E_BASE_URL="http://localhost:$port" pnpm -C "$web_root" exec playwright test memory.spec
