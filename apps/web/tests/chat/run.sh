#!/usr/bin/env bash
# SP4-B chat-panel transport proof: boots the built web app (with the
# in-process eve runtime) on a throwaway SQLite DB, creates a user +
# project with seeded venue rows, then drives the SAME wire path the
# browser chat panel uses — useEveAgent({ baseUrl: "/api/eve" }) —
# through the same-origin /api/eve proxy to the loopback eve runtime:
# POST /api/eve/v1/session + the ndjson session stream. Asserts a real
# model reply grounded in the seed rows, tool calls, and 401 without
# the session cookie.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_root="$(cd "$here/../.." && pwd)"
repo_root="$(cd "$web_root/../.." && pwd)"

: "${BIFROST_VK:?BIFROST_VK must be set}"
: "${BIFROST_BASE_URL:=http://127.0.0.1:8317/v1}"

tmp="$(mktemp -d)"
port="${CHAT_PORT:-3300}"
eve_port="${EVE_PORT:-4311}"
cleanup() {
  [ -n "${server_pid:-}" ] && kill "$server_pid" 2>/dev/null || true
  wait "${server_pid:-}" 2>/dev/null || true
  rm -rf "$tmp"
}
trap cleanup EXIT

# The eve runtime (.output/) must be built next to the web build.
if [ ! -f "$web_root/.output/server/index.mjs" ]; then
  echo "[chat] building eve runtime (.output/)"
  node "$web_root/node_modules/eve/bin/eve.js" build --skip-sandbox-prewarm
fi

export DATABASE_URL="$tmp/chat.db"
export NODE_ENV=development
export DEV_LOGIN=1
export SESSION_SECRET=chat-session-secret
export PORT="$port"
export BIFROST_VK BIFROST_BASE_URL
export TARIMA_AGENT_MODEL="${TARIMA_AGENT_MODEL:-zai-coding-plan/glm-5}"
export EMAIL_LOOPBACK_DOMAINS=tarima.test
export TELEGRAM_BOT_TOKEN=""
# The panel's proxy target: runtime.ts binds the eve runtime here and
# derives WORKFLOW_LOCAL_BASE_URL from it. Must not be the default 4310
# when another session's server already owns that socket.
export TARIMA_EVE_PORT="$eve_port"

# The app must run from its web root so cwd-relative paths (tarima.db
# default, .eve/ world, .output/ import) resolve.
cd "$web_root"
if [ ! -f dist/server/server/index.mjs ]; then
  echo "[chat] building web app (dist/)"
  pnpm --filter web build
fi
node dist/server/server/index.mjs >"$tmp/server.log" 2>&1 &
server_pid=$!

for _ in $(seq 1 120); do
  curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null || { echo "[chat] server never became healthy"; cat "$tmp/server.log"; exit 1; }
echo "[chat] web server healthy on :$port"

# Eve runtime health, via the proxy path itself (this is the tip the
# browser hits; 503 here would mean the runtime never mounted).
for _ in $(seq 1 60); do
  curl -fsS "http://127.0.0.1:$port/api/eve/v1/health" >/dev/null 2>&1 && break
  sleep 0.5
done
echo "[chat] eve health via proxy: $(curl -s -m 5 "http://127.0.0.1:$port/api/eve/v1/health" || echo FAILED)"

# 1. Dev login -> session cookie (creates qa@tarima.test).
cookie_jar="$tmp/cookies.txt"
code=$(curl -s -o /dev/null -w "%{http_code}" -c "$cookie_jar" \
  "http://127.0.0.1:$port/api/dev/login?email=qa%40tarima.test")
echo "[chat] dev-login status: $code"
grep -q tarima_session "$cookie_jar" || { echo "[chat] no session cookie"; exit 1; }

# 2. Create a project so the panel's clientContext scopes to it.
goal='{"city":"Berkeley, CA","dates":"next week or in two weeks","timeWindow":"17:30-20:30","topic":"decision models (AI, e.g. Jev/Clef)","headcount":"10-25","requirements":["wifi","group seating","TV or projector"],"sponsorshipNeeds":["venue","food","AI credits for decision models"]}'
project_json=$(curl -fsS -b "$cookie_jar" -H "content-type: application/json" \
  -d "{\"name\":\"Berkeley decision-models evening\",\"goal\":$goal}" \
  "http://127.0.0.1:$port/api/ui/projects")
project_id=$(printf '%s' "$project_json" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).project.id))")
echo "[chat] project: $project_id"

# Venue catalog rows the tools should surface.
node "$here/../turn/turn-seed-venues.mjs" "$DATABASE_URL"

# 3. 401 without the cookie — eve's channel auth must reject through the
#    proxy exactly as it does on the direct tarima surfaces.
no_cookie=$(curl -s -o "$tmp/no-cookie.json" -w "%{http_code}" -H "content-type: application/json" \
  -d "{\"message\":[{\"type\":\"text\",\"text\":\"ping\"}]}" \
  "http://127.0.0.1:$port/api/eve/v1/session")
echo "[chat] no-cookie POST /api/eve/v1/session status: $no_cookie ($(head -c 200 "$tmp/no-cookie.json"))"
[ "$no_cookie" = "401" ] || { echo "[chat] FAIL: expected 401 without cookie"; exit 1; }

# 4. The turn through the proxy (same shape the panel sends).
node "$here/chat-turn.mjs" "http://127.0.0.1:$port" "$cookie_jar" "$project_id"
