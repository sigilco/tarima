#!/usr/bin/env bash
# SP6 telegram-channel proof without real Telegram credentials.
#
# Boots the built web app (in-process eve runtime) with the Telegram
# Bot API pointed at a local fake server (TARIMA_TELEGRAM_API_BASE_URL),
# stages a tarima user + connect code directly in the throwaway DB,
# then drives fake-Telegram updates through eve's webhook
# (/eve/v1/telegram): bind, refusal, and a real bifrost agent turn.
# Requires BIFROST_VK. See telegram-e2e.mjs for the assertions.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_root="$(cd "$here/../.." && pwd)"
repo_root="$(cd "$web_root/../.." && pwd)"

: "${BIFROST_VK:?BIFROST_VK must be set}"
: "${BIFROST_BASE_URL:=http://127.0.0.1:8317/v1}"

tmp="$(mktemp -d /tmp/sp6-tg-XXXXXX)"
port="${TURN_PORT:-3210}"
tg_port="${TG_FAKE_PORT:-3410}"
cleanup() {
  [ -n "${server_pid:-}" ] && kill "$server_pid" 2>/dev/null || true
  wait "${server_pid:-}" 2>/dev/null || true
  if [ "${TG_E2E_KEEP:-0}" != "1" ]; then rm -rf "$tmp"; fi
}
trap cleanup EXIT

if [ ! -f "$web_root/.output/server/index.mjs" ]; then
  echo "[tg] building eve runtime (.output/)"
  node "$web_root/node_modules/eve/bin/eve.js" build --skip-sandbox-prewarm
fi
if [ ! -f "$web_root/dist/server/server/index.mjs" ]; then
  echo "[tg] building web app (dist/)"
  pnpm --filter web build
fi

export DATABASE_URL="$tmp/tg.db"
export NODE_ENV=development
export DEV_LOGIN=1
export SESSION_SECRET=turn-session-secret
export PORT="$port"
export BIFROST_VK BIFROST_BASE_URL
export TARIMA_AGENT_MODEL="${TARIMA_AGENT_MODEL:-zai-coding-plan/glm-5}"
export EMAIL_LOOPBACK_DOMAINS=tarima.test
export TARIMA_EVE_PORT="${TARIMA_EVE_PORT:-4310}"
# Credential-free telegram seam: no real token, Bot API on the fake.
export TELEGRAM_BOT_TOKEN="sp6-fake-bot-token"
export TELEGRAM_WEBHOOK_SECRET_TOKEN="sp6-dev-webhook-secret"
export TARIMA_TELEGRAM_API_BASE_URL="http://127.0.0.1:$tg_port"

cd "$web_root"
node dist/server/server/index.mjs >"$tmp/server.log" 2>&1 &
server_pid=$!

for _ in $(seq 1 120); do
  curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -fsS "http://127.0.0.1:$port/api/health" >/dev/null || { echo "[tg] server never became healthy"; cat "$tmp/server.log"; exit 1; }
echo "[tg] web server healthy on :$port"
for _ in $(seq 1 60); do
  curl -fsS "http://127.0.0.1:$TARIMA_EVE_PORT/eve/v1/health" >/dev/null 2>&1 && break
  sleep 0.5
done
echo "[tg] eve health: $(curl -s -m 5 "http://127.0.0.1:$TARIMA_EVE_PORT/eve/v1/health" || echo FAILED)"

# Stage a user + an unconsumed telegram connect code in the same DB the
# app (and the webhook) read — the settings page would mint this via
# POST /api/ui/settings/connect-code.
node - "$DATABASE_URL" <<'SQL'
import Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
const db = new Database(process.argv[2]);
db.prepare("INSERT OR IGNORE INTO users (id,email,role,created_at) VALUES ('u-tg-e2e','qa-tg@tarima.test','member',?)").run(Date.now());

const code = "TG" + Array.from({length:4},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
db.prepare("CREATE TABLE IF NOT EXISTS __sp6_codes (id integer primary key autoincrement, code text)").run();
db.prepare("INSERT INTO __sp6_codes (code) VALUES (?)").run(code);
db.prepare("INSERT INTO connect_codes (id,user_id,channel,code_hash,expires_at,created_at) VALUES (?,?,?,?,?,?)")
  .run(randomUUID(), "u-tg-e2e", "telegram", createHash("sha256").update(code,"utf8").digest("hex"), Date.now()+600000, Date.now());
console.log("[tg] staged connect code:", code);
SQL

TG_E2E_TMP="$tmp" node "$here/telegram-e2e.mjs" "$repo_root"
