#!/usr/bin/env bash
# Render the secrets and run the smoke test against production.
#
# The code deploy itself runs from CI (see .github/workflows/deploy.yml):
# the build job assembles the artifact and the deploy job runs the one
# sudoers-allowed command on the box. This script covers what CI does
# not: the secret render and the post-deploy check.
#
# First-time requirements (run once as root on the VPS):
#   sudo ./deploy/scripts/install-host.sh
# That installs the deploy user, the sudoers boundary, the release
# layout, the units and the Caddy config.
#
# Environment:
#   VPS_HOST      the ssh alias of the VPS (default ovhcloud)
#   SMOKE_EMAIL   an allowlisted tester address; when set, the smoke test
#                 runs against the public origin
#   SMOKE_API_KEY an optional bearer key with the projects:write scope
#   SMOKE_SKIP    set to 1 to not run the smoke test
set -euo pipefail

VPS_HOST="${VPS_HOST:-ovhcloud}"
VPS_SHARED_DIR="${VPS_SHARED_DIR:-/opt/tarima2/shared}"
UNIT="tarima.service"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://tarima.illo.fyi}"
INFISICAL_PROJECT_ID="${INFISICAL_PROJECT_ID:-76492067-b7c2-4a47-9b2d-f87ef68b1a8e}"

cd "$(dirname "$0")/.."

echo "==> rendering secrets from Infisical"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
INFISICAL_PROJECT_ID="$INFISICAL_PROJECT_ID" python3 deploy/scripts/render_secrets.py --out "$tmpdir" --phase base

echo "==> uploading the secrets"
rsync -az "$tmpdir/app.env" "$VPS_HOST:/tmp/app.env.new"
rsync -az "$tmpdir/litestream.env" "$VPS_HOST:/tmp/litestream.env.new"

# The remote script takes the paths as arguments, so nothing is expanded
# on the client side inside the command string.
ssh "$VPS_HOST" bash -s -- "$VPS_SHARED_DIR" "$UNIT" <<'REMOTE'
set -eu
shared_dir="$1"
unit="$2"
sudo install -m 600 -o web-services -g web-services \
  /tmp/app.env.new "$shared_dir/app.env"
sudo install -m 600 -o web-services -g web-services \
  /tmp/litestream.env.new "$shared_dir/litestream.env"
rm -f /tmp/app.env.new /tmp/litestream.env.new
# The service reads app.env at start, so a secret change needs a
# restart. The code itself is not touched.
sudo systemctl restart "$unit"
if [ -f "$shared_dir/litestream.env" ] && ! sudo grep -q 'unconfigured' "$shared_dir/litestream.env"; then
  sudo systemctl restart tarima-litestream.service || true
fi
sleep 2
curl -fsS http://127.0.0.1:3001/api/health
REMOTE

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
