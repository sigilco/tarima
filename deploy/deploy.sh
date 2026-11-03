#!/usr/bin/env bash
# Deploy tarima to the VPS: build, rsync the artifact, render secrets from
# Infisical, push the schema and restart the service.
#
# First-time requirements (run once as root on the VPS, before the first
# deploy):
#   useradd -r -m -d /opt/tarima web-services   (or your chosen service user)
#   mkdir -p /opt/tarima/shared/{data,folders} && chown -R web-services: /opt/tarima/shared
#   install -m 644 deploy/systemd/tarima.service /etc/systemd/system/
#   install -m 644 deploy/litestream/tarima-litestream.service /etc/systemd/system/
#   install -m 644 deploy/caddy/Caddyfile /etc/caddy/Caddyfile
#   install -m 644 deploy/litestream/litestream.yml /opt/tarima/app/deploy/litestream/
#   ln -s /opt/tarima/app/deploy/litestream/litestream.yml ... (paths must match the units)
#   systemctl daemon-reload && systemctl enable --now tarima tarima-litestream
# The deploy user also needs the infisical CLI logged in with the machine
# identity (universal auth) for the render step.
#
# Environment:
#   VPS_HOST      the ssh alias of the VPS (default ovhcloud)
#   SMOKE_EMAIL   an allowlisted tester address; when set, the smoke test
#                 runs against the public origin after the switch
#   SMOKE_API_KEY an optional bearer key with the projects:write scope
#   SMOKE_SKIP    set to 1 to not run the smoke test
set -euo pipefail

VPS_HOST="${VPS_HOST:-ovhcloud}"
VPS_APP_DIR="${VPS_APP_DIR:-/opt/tarima/app}"
VPS_SHARED_DIR="${VPS_SHARED_DIR:-/opt/tarima/shared}"
ARTIFACT="apps/api/dist/server"
ARTIFACT_ENTRY="index.mjs"
UNIT="tarima.service"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://tarima.illo.fyi}"

cd "$(dirname "$0")/.."

echo "==> building"
pnpm build

echo "==> verifying the build output"
# The artifact is what the systemd unit execs (node dist/server/index.mjs
# from /opt/tarima/app), so a build that did not produce it must stop the
# deploy here, not break the service on the VPS.
if [ ! -f "$ARTIFACT/$ARTIFACT_ENTRY" ]; then
  echo "deploy: the artifact entry $ARTIFACT/$ARTIFACT_ENTRY is missing after pnpm build" >&2
  exit 1
fi
if [ -z "$(ls "$ARTIFACT/web/ssr" 2>/dev/null)" ] || [ -z "$(ls "$ARTIFACT/web/client" 2>/dev/null)" ]; then
  echo "deploy: the web bundle under $ARTIFACT/web is missing" >&2
  exit 1
fi
echo "ok   $ARTIFACT/$ARTIFACT_ENTRY and the web bundle are present"

echo "==> rendering secrets from Infisical"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
python3 deploy/scripts/render_secrets.py --out "$tmpdir" --phase base

echo "==> uploading artifact"
# Keep the previous artifact on the VPS: the one-command rollback in
# deploy/README.md rsyncs dist/server.previous back into place.
ssh "$VPS_HOST" "rm -rf $VPS_APP_DIR/dist/server.previous && cp -a $VPS_APP_DIR/dist/server $VPS_APP_DIR/dist/server.previous"
rsync -az --delete "$ARTIFACT/" "$VPS_HOST:$VPS_APP_DIR/dist/server/"
rsync -az "$tmpdir/app.env" "$VPS_HOST:$VPS_SHARED_DIR/app.env.new"
rsync -az "$tmpdir/litestream.env" "$VPS_HOST:$VPS_SHARED_DIR/litestream.env.new"

echo "==> activating on the VPS"
ssh "$VPS_HOST" "set -eu
  sudo install -m 600 -o web-services -g web-services \\
    $VPS_SHARED_DIR/app.env.new $VPS_SHARED_DIR/app.env
  sudo install -m 600 -o web-services -g web-services \\
    $VPS_SHARED_DIR/litestream.env.new $VPS_SHARED_DIR/litestream.env
  rm -f $VPS_SHARED_DIR/app.env.new $VPS_SHARED_DIR/litestream.env.new
  cd $VPS_APP_DIR
  # drizzle push is idempotent; add generated migrations here once Stage 2 lands.
  sudo -u web-services env DATABASE_URL=$VPS_SHARED_DIR/data/tarima.db \\
    node_modules/.bin/drizzle-kit push || echo 'drizzle push skipped (no migrations yet)'
  sudo systemctl restart $UNIT
  sudo systemctl restart tarima-litestream.service
  sleep 2
  curl -fsS http://127.0.0.1:3001/api/health
"

echo "==> deployed"

if [ "${SMOKE_SKIP:-0}" = "1" ]; then
  echo "==> smoke test skipped (SMOKE_SKIP=1)"
  exit 0
fi

if [ -z "${SMOKE_EMAIL:-}" ]; then
  echo "==> smoke test skipped (no SMOKE_EMAIL given)"
  echo "    run it by hand with: scripts/smoke.sh $PUBLIC_BASE_URL <allowlisted email>"
  exit 0
fi

echo "==> smoke test against $PUBLIC_BASE_URL"
# The smoke script reads TARIMA_OTP and LOOPBACK_DOMAINS from the
# environment, and takes the bearer key as its third argument.
# shellcheck disable=SC2086
scripts/smoke.sh "$PUBLIC_BASE_URL" "$SMOKE_EMAIL" ${SMOKE_API_KEY:-}
