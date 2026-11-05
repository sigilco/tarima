#!/usr/bin/env bash
# SP8 gated-tool turn proof: boots the built web app (with the in-process
# eve runtime) on a throwaway SQLite DB, seeds a project + a food-sponsor
# entity, then drives a turn whose send_email call requires human
# approval:
#
#   1. The turn PAUSES at the gate (interaction.opened, kind=approval).
#   2. The `approvals` mirror row is asserted pending with the right
#      tool_name / interaction_id / session_id / principal_id / payload.
#   3. The approval is granted THROUGH EVE — POST
#      /api/eve/v1/session/:id { answers: [{interactionId, optionId:
#      "approve"}] }, the same body the panel's ChatApproval ->
#      agent.respond() sends. The approvals table is a MIRROR; nothing
#      in this script writes it directly.
#   4. The turn RESUMES and completes; the outbox row exists; the
#      approvals row flipped to approved with decided_by set (via the
#      interaction.settled mirror path); agent_events carries the
#      approval facts.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_root="$(cd "$here/../.." && pwd)"

: "${BIFROST_VK:?BIFROST_VK must be set}"
: "${BIFROST_BASE_URL:=http://127.0.0.1:8317/v1}"

tmp="$(mktemp -d)"
port="${CHAT_PORT:-3300}"
eve_port="${EVE_PORT:-4311}"
cleanup() {
  [ -n "${server_pid:-}" ] && kill "$server_pid" 2>/dev/null || true
  [ -n "${turn_pid:-}" ] && kill "$turn_pid" 2>/dev/null || true
  wait "${server_pid:-}" 2>/dev/null || true
  wait "${turn_pid:-}" 2>/dev/null || true
  rm -rf "$tmp"
}
trap cleanup EXIT

# The eve runtime (.output/) must be built next to the web build.
if [ ! -f "$web_root/.output/server/index.mjs" ]; then
  echo "[approval] building eve runtime (.output/)"
  node "$web_root/node_modules/eve/bin/eve.js" build --skip-sandbox-prewarm
fi

export DATABASE_URL="$tmp/approval.db"
export NODE_ENV=development
export DEV_LOGIN=1
export SESSION_SECRET=approval-session-secret
export PORT="$port"
export BIFROST_VK BIFROST_BASE_URL
export TARIMA_AGENT_MODEL="${TARIMA_AGENT_MODEL:-zai-coding-plan/glm-5}"
export EMAIL_LOOPBACK_DOMAINS=tarima.test
export TELEGRAM_BOT_TOKEN=""
# runtime.ts binds the eve runtime here and derives
# WORKFLOW_LOCAL_BASE_URL from it; must be a free port for this box.
export TARIMA_EVE_PORT="$eve_port"

cd "$web_root"
if [ ! -f dist/server/server/index.mjs ]; then
  echo "[approval] building web app (dist/)"
  pnpm --filter web build
fi
node dist/server/server/index.mjs >"$tmp/server.log" 2>&1 &
server_pid=$!

for _ in $(seq 1 120); do
  curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null || { echo "[approval] server never became healthy"; tail -50 "$tmp/server.log"; exit 1; }
echo "[approval] web server healthy on :$port"

for _ in $(seq 1 60); do
  curl -fsS "http://127.0.0.1:$port/api/eve/v1/health" >/dev/null 2>&1 && break
  sleep 0.5
done
echo "[approval] eve health via proxy: $(curl -s -m 5 "http://127.0.0.1:$port/api/eve/v1/health" || echo FAILED)"

# 1. Dev login -> session cookie.
cookie_jar="$tmp/cookies.txt"
code=$(curl -s -o /dev/null -w "%{http_code}" -c "$cookie_jar" \
  "http://127.0.0.1:$port/api/dev/login?email=qa%40tarima.test")
echo "[approval] dev-login status: $code"
grep -q tarima_session "$cookie_jar" || { echo "[approval] no session cookie"; exit 1; }

# 2. Project + sponsor entity.
goal='{"city":"Berkeley, CA","dates":"next week or in two weeks","timeWindow":"17:30-20:30","topic":"decision models (AI)","headcount":"10-25","sponsorshipNeeds":["venue","food","AI credits"]}'
project_json=$(curl -fsS -b "$cookie_jar" -H "content-type: application/json" \
  -d "{\"name\":\"Berkeley decision-models evening\",\"goal\":$goal}" \
  "http://127.0.0.1:$port/api/ui/projects")
project_id=$(printf '%s' "$project_json" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).project.id))")
echo "[approval] project: $project_id"

node "$here/approval-seed-sponsor.mjs" "$DATABASE_URL" "$project_id"

# 3. Drive the gated turn in the background; it prints PAUSED_AT_GATE
#    when the approval interaction is open, then waits for the go-file
#    before POSTing the approval.
go_file="$tmp/go"
node "$here/approval-turn.mjs" "http://127.0.0.1:$port" "$cookie_jar" "$project_id" \
  "catering@farmhouse-kitchen.test" "$go_file" >"$tmp/turn.log" 2>&1 &
turn_pid=$!

for _ in $(seq 1 240); do
  grep -q "PAUSED_AT_GATE" "$tmp/turn.log" 2>/dev/null && break
  if ! kill -0 "$turn_pid" 2>/dev/null; then
    echo "[approval] FAIL: turn driver exited before the gate"
    cat "$tmp/turn.log"
    exit 1
  fi
  sleep 1
done
grep -q "PAUSED_AT_GATE" "$tmp/turn.log" || { echo "[approval] FAIL: turn never paused at the gate"; cat "$tmp/turn.log"; exit 1; }
echo "[approval] turn paused at the approval gate"

# 4. Assert the approvals mirror row is pending. Exactly one row, the
#    right tool/session/principal, payload carrying the tool input.
session_id=$(grep -o 'session: [^ ]*' "$tmp/turn.log" | head -1 | cut -d' ' -f2)
interaction_id=$(grep -o 'interactionId: [^ ]*' "$tmp/turn.log" | head -1 | cut -d' ' -f2)
echo "[approval] session=$session_id interaction=$interaction_id"

pending_rows=$(sqlite3 "$DATABASE_URL" <<SQL
.mode list
SELECT status, tool_name, interaction_id, session_id, principal_id IS NOT NULL AS has_principal,
       json_extract(request_payload, '\$.toolInput.to') AS input_to
FROM approvals;
SQL
)
echo "[approval] approvals BEFORE:"
printf '%s\n' "$pending_rows"
pending_count=$(sqlite3 "$DATABASE_URL" "SELECT count(*) FROM approvals;")
[ "$pending_count" = "1" ] || { echo "[approval] FAIL: expected exactly 1 approvals row, got $pending_count"; exit 1; }
printf '%s' "$pending_rows" | grep -q "pending" || { echo "[approval] FAIL: row not pending"; exit 1; }
printf '%s' "$pending_rows" | grep -q "send_email" || { echo "[approval] FAIL: tool_name not send_email"; exit 1; }
printf '%s' "$pending_rows" | grep -q "$interaction_id" || { echo "[approval] FAIL: interaction_id mismatch"; exit 1; }
printf '%s' "$pending_rows" | grep -q "$session_id" || { echo "[approval] FAIL: session_id mismatch"; exit 1; }
printf '%s' "$pending_rows" | grep -q "catering@farmhouse-kitchen.test" || { echo "[approval] FAIL: request_payload missing tool input"; exit 1; }
echo "[approval] pending row OK"

# 5. Approve through eve (the same respond the panel sends).
touch "$go_file"

# 6. Wait for the driver to finish the resumed turn.
for _ in $(seq 1 240); do
  grep -qE "PASS|FAIL" "$tmp/turn.log" 2>/dev/null && break
  if ! kill -0 "$turn_pid" 2>/dev/null; then break; fi
  sleep 1
done
cat "$tmp/turn.log"
grep -q "PASS" "$tmp/turn.log" || { echo "[approval] FAIL: resumed turn did not pass"; exit 1; }

# 7. Assert the outbox row exists and the approvals row flipped to
#    approved via the interaction.settled mirror path.
outbox_rows=$(sqlite3 "$DATABASE_URL" "SELECT type, status, json_extract(payload, '\$.to') FROM outbox;")
echo "[approval] outbox: $outbox_rows"
printf '%s' "$outbox_rows" | grep -q "agent.email|staged|catering@farmhouse-kitchen.test" \
  || { echo "[approval] FAIL: no staged outbox row"; exit 1; }

approved_rows=$(sqlite3 "$DATABASE_URL" \
  "SELECT status, decided_by IS NOT NULL, decided_at IS NOT NULL FROM approvals;")
echo "[approval] approvals AFTER: $approved_rows"
printf '%s' "$approved_rows" | grep -q "^approved|1|1" \
  || { echo "[approval] FAIL: approvals row not approved with decided_by/decided_at"; exit 1; }

# 8. Assert the agent_events mirror carries the approval facts.
events=$(sqlite3 "$DATABASE_URL" \
  "SELECT type, count(*) FROM agent_events WHERE session_id='$session_id' GROUP BY type ORDER BY type;")
echo "[approval] agent_events:"
printf '%s\n' "$events"
for want in call.requested interaction.opened interaction.settled call.settled turn.settled; do
  printf '%s' "$events" | grep -q "$want" || { echo "[approval] FAIL: agent_events missing $want"; exit 1; }
done

echo "[approval] PASS: gated send_email turn paused, approved through eve, resumed, mirrored"
