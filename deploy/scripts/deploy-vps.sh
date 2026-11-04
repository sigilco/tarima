#!/usr/bin/env bash
# Host-side deploy script: run on the VPS by CI (or by hand) as root.
#
#   sudo /opt/tarima2/repo/deploy/scripts/deploy-vps.sh '<ref>'
#
# Trust boundary: the sudoers entry for the `deploy` user (installed by
# deploy/scripts/install-host.sh) allows exactly this one command, so CI
# never gets a general shell on the box. CI supplies the ref; the script
# resolves it, refreshes this checkout at /opt/tarima2/repo to it, and
# swaps the artifact.
#
# Contract with the caller (mirrors brioso):
# - prints exactly one ::DEPLOY_RESULT:: line: status=ok|failed sha=<ref> prev_sha=<sha>
# - exit 0 when the new artifact serves /api/health, 1 otherwise
# - keeps the previous artifact at $VPS_APP_DIR/dist/server.previous for
#   the one-command rollback in deploy/README.md
#
# The artifact itself is built in CI (deploy.yml) and uploaded to
# /tmp/tarima-artifact.tar.zst before this script runs. Building on the
# box would need the whole toolchain; CI already has it.
set -euo pipefail

VPS_APP_DIR="${VPS_APP_DIR:-/opt/tarima2/app}"
VPS_SHARED_DIR="${VPS_SHARED_DIR:-/opt/tarima2/shared}"
REPO_DIR="${REPO_DIR:-/opt/tarima2/repo}"
ARTIFACT_ENTRY="index.mjs"
UNIT="tarima.service"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/api/health}"
ARTIFACT_TAR="/tmp/tarima-artifact.tar.zst"

REF="${1:?usage: deploy-vps.sh <ref>}"
SERVICE="web-services"

PREV_SHA="unknown"
die() { echo "deploy-vps: $*" >&2; echo "::DEPLOY_RESULT:: status=failed sha=$REF prev_sha=$PREV_SHA"; exit 1; }

[ "$(id -u)" -eq 0 ] || die "must run as root (sudo)"
[ -d "$REPO_DIR/.git" ] || die "checkout missing at $REPO_DIR (run install-host.sh first)"
[ -f "$ARTIFACT_TAR" ] || die "artifact tarball missing at $ARTIFACT_TAR (CI uploads it)"

PREV_SHA="$(git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"

echo "==> resolving $REF"
git -C "$REPO_DIR" fetch origin --quiet
SHA="$(git -C "$REPO_DIR" rev-parse --verify --quiet "$REF^{commit}")" \
  || die "ref $REF not resolvable in $REPO_DIR"

echo "==> checking out $SHA"
git -C "$REPO_DIR" checkout --quiet --force "$SHA"

echo "==> unpacking artifact"
# Only dist/ comes from CI; env files, data and node_modules stay on the box.
if [ -d "$VPS_APP_DIR/dist/server" ]; then
  rm -rf "$VPS_APP_DIR/dist/server.previous"
  cp -a "$VPS_APP_DIR/dist/server" "$VPS_APP_DIR/dist/server.previous"
fi
mkdir -p "$VPS_APP_DIR/dist"
tar --zstd -xf "$ARTIFACT_TAR" -C "$VPS_APP_DIR/dist"
rm -f "$ARTIFACT_TAR"
[ -f "$VPS_APP_DIR/dist/server/$ARTIFACT_ENTRY" ] || die "artifact entry $ARTIFACT_ENTRY missing after unpack"
[ -d "$VPS_APP_DIR/dist/server/web/ssr" ] || die "web ssr bundle missing after unpack"

echo "==> pushing schema"
cd "$VPS_APP_DIR"
sudo -u "$SERVICE" env DATABASE_URL="$VPS_SHARED_DIR/data/tarima.db" \
  node_modules/.bin/drizzle-kit push --force \
  || die "drizzle-kit push failed"

echo "==> restarting $UNIT"
systemctl restart "$UNIT"

echo "==> health check"
ok=0
for _ in 1 2 3 4 5; do
  sleep 2
  if curl -fsS "$HEALTH_URL" > /dev/null 2>&1; then ok=1; break; fi
done
if [ "$ok" -ne 1 ]; then
  if [ -d "$VPS_APP_DIR/dist/server.previous" ]; then
    echo "health check failed: rolling back to server.previous" >&2
    rm -rf "$VPS_APP_DIR/dist/server"
    cp -a "$VPS_APP_DIR/dist/server.previous" "$VPS_APP_DIR/dist/server"
    systemctl restart "$UNIT"
  fi
  die "health check failed after 5 attempts"
fi

echo "::DEPLOY_RESULT:: status=ok sha=$SHA prev_sha=$PREV_SHA"
echo "==> deployed $SHA (previous: $PREV_SHA)"
