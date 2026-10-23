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
set -euo pipefail

VPS_HOST="${VPS_HOST:-ovhcloud}"
VPS_APP_DIR="${VPS_APP_DIR:-/opt/tarima/app}"
VPS_SHARED_DIR="${VPS_SHARED_DIR:-/opt/tarima/shared}"
ARTIFACT="apps/api/dist/server"
UNIT="tarima.service"

cd "$(dirname "$0")/.."

echo "==> building"
pnpm build

echo "==> rendering secrets from Infisical"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
python3 deploy/scripts/render_secrets.py --out "$tmpdir" --phase base

echo "==> uploading artifact"
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
