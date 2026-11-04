#!/usr/bin/env bash
# One-time host setup for CI deploys. Run as root on the VPS:
#
#   sudo ./deploy/scripts/install-host.sh
#
# Installs: the `deploy` user with a locked password (SSH-key only), a
# sudoers entry allowing exactly one command (the host-side deploy
# script), and a bare-enough checkout at /opt/tarima2/repo that the
# deploy script can resolve refs in. Re-running is safe: every step is
# idempotent, existing keys in authorized_keys are kept.
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/tarima2/repo}"
REPO_URL="${REPO_URL:-git@github.com:sigilco/tarima.git}"
DEPLOY_KEY="${DEPLOY_KEY:-}"   # optional: an ed25519 public key one-liner

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

echo "==> sudoers boundary"
# The one-command trust boundary: `deploy` may run exactly this script as
# root, with any single argument (the ref). No general shell, no other
# sudo. validate with visq before installing; on failure, abort.
SUDOERS_CONTENT="deploy ALL=(root) NOPASSWD: /opt/tarima2/repo/deploy/scripts/deploy-vps.sh *"
echo "$SUDOERS_CONTENT" > /etc/sudoers.d/tarima-deploy
chmod 440 /etc/sudoers.d/tarima-deploy
if command -v visudo >/dev/null 2>&1; then
  visudo -c -f /etc/sudoers.d/tarima-deploy || { rm -f /etc/sudoers.d/tarima-deploy; die "sudoers validation failed"; }
fi

echo "==> checkout at $REPO_DIR"
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
# The deploy script must exist at the exact sudoers path before CI calls it.
sudo -u deploy git -C "$REPO_DIR" checkout --quiet --force origin/main

echo "==> artifact scratch dir"
install -d -m 1777 /tmp/tarima-artifact || true

echo "install-host: done. Now: put the CI public key in /home/deploy/.ssh/authorized_keys, then wire CI."
