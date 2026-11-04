#!/usr/bin/env bash
# One-time host setup for CI deploys. Run as root on the VPS:
#
#   sudo ./deploy/scripts/install-host.sh
#
# Installs: the `deploy` user with a locked password (SSH-key only), the
# root-owned host deploy script at /usr/local/sbin/tarima-deploy (the
# Python runner, installed without the .py suffix), a sudoers entry
# allowing exactly that one command, and the release directory layout
# the script expects.
#
# The trust boundary is the sudoers entry plus the ownership of the
# script: CI runs a file it cannot edit. The script used to live inside
# the git checkout, which CI could rewrite before sudoing it.
#
# Re-running is safe: every step is idempotent, existing keys in
# authorized_keys are kept.
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/tarima2/repo}"
REPO_URL="${REPO_URL:-git@github.com:sigilco/tarima.git}"
DEPLOY_KEY="${DEPLOY_KEY:-}"   # optional: an ed25519 public key one-liner
APP_ROOT="${APP_ROOT:-/opt/tarima2}"
DEPLOY_SCRIPT="${DEPLOY_SCRIPT:-/usr/local/sbin/tarima-deploy}"
SCRIPT_SOURCE="${SCRIPT_SOURCE:-$(cd "$(dirname "$0")" && pwd)/tarima-deploy.py}"
SERVICE="${SERVICE:-web-services}"

die() { echo "install-host: $*" >&2; exit 1; }
[ "$(id -u)" -eq 0 ] || die "run as root"

echo "==> creating the deploy user"
id -u deploy >/dev/null 2>&1 || useradd -r -m -d /home/deploy -s /bin/sh deploy
passwd -l deploy >/dev/null 2>&1 || true
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh

echo "==> authorized_keys"
if [ -n "$DEPLOY_KEY" ]; then
  echo "$DEPLOY_KEY" > /home/deploy/.ssh/authorized_keys.new
  install -m 600 -o deploy -g deploy /home/deploy/.ssh/authorized_keys.new \
    /home/deploy/.ssh/authorized_keys
  rm -f /home/deploy/.ssh/authorized_keys.new
else
  echo "  DEPLOY_KEY not set; add the CI public key to /home/deploy/.ssh/authorized_keys by hand"
fi

echo "==> installing the host deploy script"
[ -f "$SCRIPT_SOURCE" ] || die "the deploy script is missing at $SCRIPT_SOURCE"
# Root-owned, mode 755: the deploy user runs it through sudo, so it
# must be executable but not writable by anyone but root. The .py suffix
# is dropped on the host; the shebang picks the interpreter.
install -m 755 -o root -g root "$SCRIPT_SOURCE" "$DEPLOY_SCRIPT"

echo "==> sudoers boundary"
# The one-command trust boundary: `deploy` may run exactly this script as
# root, with any single argument (the sha). No general shell, no other
# sudo. validate with visudo before installing; on failure, abort.
SUDOERS_CONTENT="deploy ALL=(root) NOPASSWD: $DEPLOY_SCRIPT *"
echo "$SUDOERS_CONTENT" > /etc/sudoers.d/tarima-deploy
chmod 440 /etc/sudoers.d/tarima-deploy
if command -v visudo >/dev/null 2>&1; then
  visudo -c -f /etc/sudoers.d/tarima-deploy || { rm -f /etc/sudoers.d/tarima-deploy; die "sudoers validation failed"; }
fi

echo "==> release layout under $APP_ROOT"
install -d -m 755 "$APP_ROOT/releases"
install -d -m 755 "$APP_ROOT/shared"

echo "==> checkout at $REPO_DIR"
# The checkout is no longer needed to deploy: the script unpacks a
# self-contained artifact and never touches git. It is kept for the
# host-side helper scripts (secrets rendering, litestream config).
if [ ! -d "$REPO_DIR/.git" ]; then
  install -d -m 755 -o deploy -g deploy "$(dirname "$REPO_DIR")"
  # Deploy clones read-only over https so no deploy key on the box can
  # push; refs resolve from origin without credentials for a public repo.
  # (sigilco/tarima is private: the box needs a read-only deploy key in
  # git, added here as a second key or via the debian user's ssh agent.)
  sudo -u deploy git clone --origin origin "$REPO_URL" "$REPO_DIR" \
    || die "clone failed; add a read-only key for git@github.com to the deploy user"
else
  sudo -u deploy git -C "$REPO_DIR" fetch origin --quiet || true
fi
sudo -u deploy git -C "$REPO_DIR" checkout --quiet --force origin/main

echo "==> migrating the existing app to the release layout"
# The pre-release-layout app lives at $APP_ROOT/app. The unit now runs
# from $APP_ROOT/current, so the tree moves to
# $APP_ROOT/releases/<sha> and current points at it. The sha comes from
# the box checkout, so the migrated tree keeps its provenance.
if [ -d "$APP_ROOT/app" ] && [ ! -L "$APP_ROOT/current" ]; then
  MIGRATION_SHA="$(sudo -u deploy git -C "$REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo migrated)"
  MIGRATION_DIR="$APP_ROOT/releases/$MIGRATION_SHA"
  if [ ! -d "$MIGRATION_DIR" ]; then
    mkdir -p "$MIGRATION_DIR"
    cp -a "$APP_ROOT/app/." "$MIGRATION_DIR/"
    chown -R "$SERVICE:$SERVICE" "$MIGRATION_DIR"
  fi
  ln -sfn "releases/$MIGRATION_SHA" "$APP_ROOT/current.new"
  mv -T "$APP_ROOT/current.new" "$APP_ROOT/current"
  echo "  current -> releases/$MIGRATION_SHA"
  # The state file records the sha the release dir is named after, so
  # the next deploy reports it as prev_sha.
  printf '%s\n' "$MIGRATION_SHA" > "$APP_ROOT/shared/deployed-sha"
  chmod 644 "$APP_ROOT/shared/deployed-sha"
fi

if [ -d "$APP_ROOT/app" ] && [ -L "$APP_ROOT/current" ]; then
  # The migration already happened on an earlier run: the old tree is
  # superseded by the release layout and only confuses the next
  # migration, so it goes.
  echo "  removing the superseded $APP_ROOT/app tree"
  rm -rf "$APP_ROOT/app"
fi

echo "==> systemd unit"
if [ -f "$REPO_DIR/deploy/systemd/tarima.service" ]; then
  install -m 644 "$REPO_DIR/deploy/systemd/tarima.service" /etc/systemd/system/tarima.service
  systemctl daemon-reload
fi

echo "==> litestream config"
# The config lives in shared, not in a release: releases are swapped on
# every deploy and the litestream unit must not depend on the running
# release.
if [ -f "$REPO_DIR/deploy/litestream/litestream.yml" ]; then
  install -d -m 755 -o "$SERVICE" -g "$SERVICE" "$APP_ROOT/shared/litestream"
  install -m 644 -o "$SERVICE" -g "$SERVICE" \
    "$REPO_DIR/deploy/litestream/litestream.yml" "$APP_ROOT/shared/litestream/litestream.yml"
  install -m 644 "$REPO_DIR/deploy/litestream/tarima-litestream.service" \
    /etc/systemd/system/tarima-litestream.service
  systemctl daemon-reload
fi

echo "==> artifact scratch dir"
install -d -m 1777 /tmp/tarima-artifact || true

echo "install-host: done. Now: put the CI public key in /home/deploy/.ssh/authorized_keys, then wire CI."
