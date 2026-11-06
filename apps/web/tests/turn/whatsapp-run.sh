#!/usr/bin/env bash
# WhatsApp-channel round-trip proof without real Meta credentials (W3).
#
# Boots the built web app (with the in-process eve runtime) on a
# throwaway SQLite DB with the stub LLM, points the Chat SDK WhatsApp
# adapter at the mock Graph API (WHATSAPP_API_BASE_URL), stages a tarima
# user + connect code directly in that DB, then drives signed webhook
# posts through eve's channel route (/eve/v1/whatsapp):
#
#   1. stranger message  → connect notice, no turn, nothing sent
#   2. /start CODE       → binding confirmation via the mock Graph API
#   3. bound message     → agent turn (stub LLM) → reply to the mock
#   4. duplicate wamid   → processed once (no second reply)
#
# See whatsapp-roundtrip.mjs for the assertions.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_root="$(cd "$here/../.." && pwd)"
repo_root="$(cd "$web_root/../../.." && pwd)"

tmp="$(mktemp -d /tmp/w3-wa-XXXXXX)"
port="${TURN_PORT:-3220}"
wa_port="${WA_MOCK_PORT:-3522}"
eve_port="${TARIMA_EVE_PORT:-4320}"
export APP_SECRET="w3-dev-wa-app-secret"

cleanup() {
  # server_pid leads its own process group (detached spawn below); kill
  # the group so eve workflow workers cannot outlive the harness.
  [ -n "${server_pid:-}" ] && kill -TERM "-$server_pid" 2>/dev/null || true
  [ -n "${mock_pid:-}" ] && kill "$mock_pid" 2>/dev/null || true
  sleep 1
  [ -n "${server_pid:-}" ] && kill -KILL "-$server_pid" 2>/dev/null || true
  [ -n "${mock_pid:-}" ] && kill "$mock_pid" 2>/dev/null || true
  wait "${mock_pid:-}" 2>/dev/null || true
  if [ "${WA_E2E_KEEP:-0}" != "1" ]; then rm -rf "$tmp"; fi
}
trap cleanup EXIT

if [ ! -f "$web_root/.output/server/index.mjs" ]; then
  echo "[wa] building eve runtime (.output/)"
  (cd "$web_root" && node node_modules/eve/bin/eve.js build --skip-sandbox-prewarm)
fi
if [ ! -f "$web_root/dist/server/server/index.mjs" ]; then
  echo "[wa] building web app (dist/)"
  (cd "$repo_root" && pnpm --filter web build)
fi

export DATABASE_URL="$tmp/wa.db"
export NODE_ENV=development
export DEV_LOGIN=1
export SESSION_SECRET=w3-session-secret
export PORT="$port"
export TARIMA_AGENT_STUB=1
export EMAIL_LOOPBACK_DOMAINS=tarima.test
export TARIMA_EVE_PORT="$eve_port"
# Credential-free WhatsApp seam: mock Graph API + throwaway secrets.
export WHATSAPP_ACCESS_TOKEN=w3-fake-access-token
export WHATSAPP_APP_SECRET="$APP_SECRET"
export WHATSAPP_PHONE_NUMBER_ID=123456789
export WHATSAPP_VERIFY_TOKEN=w3-fake-verify-token
export WHATSAPP_API_BASE_URL="http://127.0.0.1:$wa_port"
# Pin the eve local-workflow queue transport to an explicit IPv4 URL on
# the eve origin: its default (http://localhost:$PORT) fails
# intermittently on this host and the retry loop then leaves the run
# stuck in `pending`. agent/runtime.ts re-pins this to TARIMA_EVE_PORT
# when it mounts the runtime in-process; keep the export consistent.
export WORKFLOW_LOCAL_BASE_URL="http://127.0.0.1:$eve_port"

# The mock Graph API in its own process; its stdout is the assertion log.
node "$web_root/tests/mocks/whatsapp-mock.mjs" "$wa_port" "$APP_SECRET" >"$tmp/mock.log" 2>&1 &
mock_pid=$!
for _ in $(seq 1 40); do
  curl -fsS "http://127.0.0.1:$wa_port/health" >/dev/null 2>&1 && break
  sleep 0.25
done
echo "[wa] mock Graph API on :$wa_port"

cd "$web_root"
# Clean workflow state before boot: stale queue deliveries from earlier
# runs would resume and wedge fresh turns.
rm -rf "$web_root/.eve/.workflow-data"
# Own process group so tool teardown cannot signal the server mid-test.
# setsid is Linux-only; spawn detached through node (portable) and take
# the child's pid — with detached:true its pgid equals its pid.
server_pid="$(node -e '
  const { spawn } = require("node:child_process");
  const { openSync } = require("node:fs");
  const out = openSync(process.argv[1], "a");
  const c = spawn(process.execPath, [process.argv[2]], {
    cwd: process.argv[3],
    detached: true,
    stdio: ["ignore", out, out],
  });
  c.unref();
  console.log(c.pid);
' "$tmp/server.log" "$web_root/dist/server/server/index.mjs" "$web_root")"
echo "[wa] server pid $server_pid (own process group)"


for _ in $(seq 1 120); do
  curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null || { echo "[wa] server never became healthy"; cat "$tmp/server.log"; exit 1; }
echo "[wa] web server healthy on :$port"
for _ in $(seq 1 60); do
  curl -fsS "http://127.0.0.1:$eve_port/eve/v1/health" >/dev/null 2>&1 && break
  sleep 0.5
done
echo "[wa] eve health: $(curl -s -m 5 "http://127.0.0.1:$eve_port/eve/v1/health" || echo FAILED)"
# Readiness wait on the eve queue before posting webhooks: the local
# workflow world delivers queued turns by POSTing
# /.well-known/workflow/v1/flow on the eve origin. While the runtime is
# still booting that first delivery gets ECONNREFUSED and the run can
# stall. Any HTTP status (the route answers 401 without the delivery
# secret) proves the socket and the route are live — no blind sleep.
for _ in $(seq 1 120); do
  code="$(curl -s -m 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$eve_port/.well-known/workflow/v1/flow" || true)"
  [ "$code" != "000" ] && [ -n "$code" ] && break
  sleep 0.5
done
echo "[wa] workflow queue route ready (HTTP $code)"

# Stage a user + an unconsumed whatsapp connect code in the same DB the
# app (and the webhook) read.
node - "$DATABASE_URL" <<'SQL'
import Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
const db = new Database(process.argv[2]);
db.prepare("INSERT OR IGNORE INTO users (id,email,role,created_at) VALUES ('u-wa-e2e','qa-wa@tarima.test','member',?)").run(Date.now());
const code = "WA" + Array.from({length:4},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
db.prepare("CREATE TABLE IF NOT EXISTS __w3_codes (id integer primary key autoincrement, code text)").run();
db.prepare("INSERT INTO __w3_codes (code) VALUES (?)").run(code);
db.prepare("INSERT INTO connect_codes (id,user_id,channel,code_hash,expires_at,created_at) VALUES (?,?,?,?,?,?)")
  .run(randomUUID(), "u-wa-e2e", "whatsapp", createHash("sha256").update(code,"utf8").digest("hex"), Date.now()+600000, Date.now());
console.log("[wa] staged connect code:", code);
SQL

APP_DB="$DATABASE_URL" WA_E2E_TMP="$tmp" node "$here/whatsapp-roundtrip.mjs"
