#!/usr/bin/env bash
# SP3-B working-turn proof: boots the built web app (with the in-process
# eve runtime) on a throwaway SQLite DB, creates a user + project with a
# task + venue rows through the app's own API, sends the canonical
# product-owner seed prompt to POST /api/agent/turn with the session
# cookie, and asserts the reply reflects tarima's db + 401 without the
# cookie. Requires BIFROST_VK (gateway virtual key) in the environment.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_root="$(cd "$here/../.." && pwd)"
repo_root="$(cd "$web_root/../.." && pwd)"

: "${BIFROST_VK:?BIFROST_VK must be set}"
: "${BIFROST_BASE_URL:=http://127.0.0.1:8317/v1}"

tmp="$(mktemp -d)"
port="${TURN_PORT:-3200}"
cleanup() {
  [ -n "${server_pid:-}" ] && kill "$server_pid" 2>/dev/null || true
  wait "${server_pid:-}" 2>/dev/null || true
  rm -rf "$tmp"
}
trap cleanup EXIT

# The eve runtime (.output/) must be built next to the web build.
if [ ! -f "$web_root/.output/server/index.mjs" ]; then
  echo "[turn] building eve runtime (.output/)"
  node "$web_root/node_modules/eve/bin/eve.js" build --skip-sandbox-prewarm
fi

export DATABASE_URL="$tmp/turn.db"
export NODE_ENV=development
export DEV_LOGIN=1
export SESSION_SECRET=turn-session-secret
export PORT="$port"
export BIFROST_VK BIFROST_BASE_URL
export TARIMA_AGENT_MODEL="${TARIMA_AGENT_MODEL:-zai-coding-plan/glm-5}"
export EMAIL_LOOPBACK_DOMAINS=tarima.test
export TELEGRAM_BOT_TOKEN=""
export TARIMA_EVE_PORT="${TARIMA_EVE_PORT:-4310}"

# The app must run from its web root so cwd-relative paths (tarima.db
# default, .eve/ world, .output/ import) resolve.
cd "$web_root"
if [ ! -f dist/server/server/index.mjs ]; then
  echo "[turn] building web app (dist/)"
  pnpm --filter web build
fi
node dist/server/server/index.mjs >"$tmp/server.log" 2>&1 &
server_pid=$!

for _ in $(seq 1 120); do
  curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null || { echo "[turn] server never became healthy"; cat "$tmp/server.log"; exit 1; }
echo "[turn] web server healthy on :$port"

# Eve runtime health (in-process mount).
for _ in $(seq 1 60); do
  curl -fsS "http://127.0.0.1:$TARIMA_EVE_PORT/eve/v1/health" >/dev/null 2>&1 && break
  sleep 0.5
done
echo "[turn] eve health: $(curl -s -m 5 "http://127.0.0.1:$TARIMA_EVE_PORT/eve/v1/health" || echo FAILED)"

# 1. Dev login -> session cookie (creates qa@tarima.test).
cookie_jar="$tmp/cookies.txt"
code=$(curl -s -o /dev/null -w "%{http_code}" -c "$cookie_jar" \
  "http://127.0.0.1:$port/api/dev/login?email=qa%40tarima.test")
echo "[turn] dev-login status: $code"
grep -q tarima_session "$cookie_jar" || { echo "[turn] no session cookie"; exit 1; }

# 2. Create a project through the session-surface API, with the seed
#    brief as the structured goal.
goal='{"city":"Berkeley, CA","dates":"next week or in two weeks","timeWindow":"17:30-20:30","topic":"decision models (AI, e.g. Jev/Clef)","headcount":"10-25","requirements":["wifi","group seating","TV or projector"],"sponsorshipNeeds":["venue","food","AI credits for decision models"]}'
project_json=$(curl -fsS -b "$cookie_jar" -H "content-type: application/json" \
  -d "{\"name\":\"Berkeley decision-models evening\",\"goal\":$goal}" \
  "http://127.0.0.1:$port/api/ui/projects")
project_id=$(printf '%s' "$project_json" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).project.id))")
echo "[turn] project: $project_id"

# One task entity on the board.
curl -fsS -b "$cookie_jar" -H "content-type: application/json" \
  -d '{"name":"Find venue sponsor","status":"intake","missing":[]}' \
  "http://127.0.0.1:$port/api/ui/projects/$project_id/entities" >/dev/null
# Venue catalog rows the tools should surface.
node "$here/turn-seed-venues.mjs" "$DATABASE_URL"

# 3. 401 without the cookie (same call, no jar).
no_cookie=$(curl -s -o "$tmp/no-cookie.json" -w "%{http_code}" -H "content-type: application/json" \
  -d '{"message":"ping"}' "http://127.0.0.1:$port/api/agent/turn")
echo "[turn] no-cookie status: $no_cookie ($(cat "$tmp/no-cookie.json"))"
[ "$no_cookie" = "401" ] || { echo "[turn] FAIL: expected 401 without cookie"; exit 1; }

# 4. The turn with the cookie + seed prompt.
node "$here/agent-turn.mjs" "http://127.0.0.1:$port" "$cookie_jar" "$project_id"
