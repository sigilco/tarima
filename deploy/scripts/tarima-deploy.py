#!/usr/bin/env python3
"""Host-side deploy script: run on the VPS by CI (or by hand) as root.

    sudo /usr/local/sbin/tarima-deploy '<sha>'

Trust boundary: the sudoers entry for the `deploy` user (installed by
deploy/scripts/install-host.sh) allows exactly this one command, and the
script itself is root-owned and lives outside the repo checkout. CI
cannot edit what it sudo-runs.

Layout on the box:
  /opt/tarima2/releases/<sha>/{dist/server,node_modules,package.json}
  /opt/tarima2/current -> releases/<sha>   (symlink, swapped atomically)
  /opt/tarima2/shared/deployed-sha          (the sha currently serving)

A release is never partially replaced: the new tree is unpacked into its
own release dir and only then does `current` flip. A rollback is a
symlink flip plus a restart, so there is no state to corrupt.

Contract with the caller:
- prints exactly one ::DEPLOY_RESULT:: line: status=ok|failed sha=<sha> prev_sha=<sha>
- exit 0 when the new release serves /api/health and /, 1 otherwise

The artifact itself is built in CI (deploy.yml) and uploaded to
/tmp/tarima-artifact-<sha>.tar.zst before this script runs. Building on
the box would need the whole toolchain; CI already has it.

Python 3 stdlib only (>= 3.11). The only external binaries are `tar`
(zstd unpack) and `systemctl restart` (skipped under DRY_RUN). There is
no node on the host: the native-binding load check lives in CI.
"""

from __future__ import annotations

import fcntl
import grp
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from pwd import getpwnam
from typing import NoReturn

APP_ROOT = Path(os.environ.get("APP_ROOT", "/opt/tarima2"))
RELEASES_DIR = Path(os.environ.get("RELEASES_DIR", APP_ROOT / "releases"))
SHARED_DIR = Path(os.environ.get("SHARED_DIR", APP_ROOT / "shared"))
CURRENT_LINK = Path(os.environ.get("CURRENT_LINK", APP_ROOT / "current"))
ARTIFACT_ENTRY = os.environ.get("ARTIFACT_ENTRY", "index.mjs")
UNIT = os.environ.get("UNIT", "tarima.service")
SERVICE = os.environ.get("SERVICE", "web-services")
HEALTH_URL = os.environ.get("HEALTH_URL", "http://127.0.0.1:3001/api/health")
ROOT_URL = os.environ.get("ROOT_URL", "http://127.0.0.1:3001/")
# The health probe is a command so the tests can drive both outcomes
# without a server. The default checks both endpoints: /api/health
# proves the process is up, / proves the SSR bundle loads. A broken SSR
# bundle used to look healthy.
HEALTH_CMD = os.environ.get("HEALTH_CMD", "")
HEALTH_ATTEMPTS = int(os.environ.get("HEALTH_ATTEMPTS", "5"))
HEALTH_INTERVAL = float(os.environ.get("HEALTH_INTERVAL", "2"))
KEEP_RELEASES = int(os.environ.get("KEEP_RELEASES", "5"))
STATE_FILE = Path(os.environ.get("STATE_FILE", SHARED_DIR / "deployed-sha"))
LOCK_FILE = Path(os.environ.get("LOCK_FILE", APP_ROOT / ".tarima-deploy.lock"))
# A dry run has no systemd on the box, so the restart is stubbed out.
DRY_RUN = os.environ.get("DRY_RUN", "0") == "1"

SHA = sys.argv[1] if len(sys.argv) > 1 else ""
PREV_SHA = "unknown"


def log(msg: str) -> None:
    print(f"==> {msg}")


def warn(msg: str) -> None:
    print(f"tarima-deploy: {msg}", file=sys.stderr)


def result(status: str) -> None:
    print(f"::DEPLOY_RESULT:: status={status} sha={SHA} prev_sha={PREV_SHA}")


def die(msg: str) -> NoReturn:
    warn(msg)
    result("failed")
    sys.exit(1)


def flip_current(sha: str) -> None:
    """Point the current symlink at a release, atomically.

    The new link is created under a temporary name and renamed over the
    old one: rename(2) over an existing symlink is atomic on Linux, so
    the service never sees a half-written current. (The bash version had
    a BSD mv fallback because BSD mv lacks -T; os.rename does not.)
    """
    tmp = CURRENT_LINK.with_name(CURRENT_LINK.name + ".new")
    os.symlink(f"releases/{sha}", tmp)
    os.rename(tmp, CURRENT_LINK)


def restart_unit() -> int:
    if DRY_RUN:
        log(f"dry run: skipping the restart of {UNIT}")
        return 0
    return subprocess.call(["systemctl", "restart", UNIT])


def health_ok() -> bool:
    """One health probe. The default hits both endpoints."""
    if HEALTH_CMD:
        return subprocess.call(["bash", "-c", HEALTH_CMD]) == 0
    for url in (HEALTH_URL, ROOT_URL):
        try:
            with urllib.request.urlopen(url, timeout=5) as resp:
                if resp.status != 200:
                    return False
        except (urllib.error.URLError, OSError):
            return False
    return True


def rollback() -> bool:
    """Point current back at the previous release and restart.

    Every step runs even if an earlier one fails, so the rollback
    itself never leaves the service down.
    """
    if PREV_SHA == "unknown" or not (RELEASES_DIR / PREV_SHA).is_dir():
        warn("no previous release to roll back to")
        return False
    try:
        flip_current(PREV_SHA)
    except OSError as exc:
        warn(f"rollback flip failed: {exc}")
        return False
    if restart_unit() != 0:
        return False
    warn(f"rolled back to {PREV_SHA}")
    return True


def prune(release_dir: Path) -> None:
    """Keep the newest KEEP_RELEASES releases, never the current one."""
    if not RELEASES_DIR.is_dir():
        return
    entries = sorted(
        (p for p in RELEASES_DIR.iterdir() if p.is_dir()),
        key=lambda p: p.name,
        reverse=True,
    )
    for path in entries[KEEP_RELEASES:]:
        if path != release_dir:
            shutil.rmtree(path)


def main() -> None:
    global PREV_SHA

    if not SHA:
        warn("usage: tarima-deploy <sha>")
        print("::DEPLOY_RESULT:: status=failed sha=unknown prev_sha=unknown")
        sys.exit(1)

    # A sha is a directory name under releases/, so it must not be able to
    # escape it. Accept the short and the long form, nothing else.
    if not SHA or not all(c in "0123456789abcdef" for c in SHA):
        die(f"refusing a non-hex sha: {SHA}")
    if len(SHA) < 7:
        die(f"sha too short: {SHA}")

    # The artifact is named after the sha it carries. A leftover file from
    # an earlier deploy therefore never collides with this one, and a
    # truncated upload cannot be mistaken for the current release.
    artifact_tar = Path(os.environ.get("ARTIFACT_TAR", f"/tmp/tarima-artifact-{SHA}.tar.zst"))

    # One deploy at a time. The lock is held for the whole script so a
    # second CI run cannot interleave with the release swap.
    APP_ROOT.mkdir(mode=0o755, parents=True, exist_ok=True)
    lock_fd = os.open(LOCK_FILE, os.O_CREAT | os.O_WRONLY, 0o644)
    try:
        try:
            fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            die(f"another deploy is running (lock: {LOCK_FILE})")

        if not artifact_tar.is_file():
            die(f"artifact tarball missing at {artifact_tar} (CI uploads it)")

        # The previously deployed sha comes from the state file the last
        # successful deploy wrote, not from a git checkout: the box does
        # not need a repo to deploy.
        if STATE_FILE.is_file():
            prev = STATE_FILE.read_text().strip()
            if prev:
                PREV_SHA = prev

        release_dir = RELEASES_DIR / SHA

        log(f"unpacking artifact into {release_dir}")
        # A retried deploy of the same sha must not reuse a half-written tree.
        shutil.rmtree(release_dir, ignore_errors=True)
        RELEASES_DIR.mkdir(mode=0o755, parents=True, exist_ok=True)
        release_dir.mkdir(mode=0o755)
        if subprocess.call(["tar", "--zstd", "-xf", str(artifact_tar), "-C", str(release_dir)]) != 0:
            die(f"tar unpack of {artifact_tar} failed")
        artifact_tar.unlink(missing_ok=True)

        log("verifying the release")
        if not (release_dir / "dist" / "server" / ARTIFACT_ENTRY).is_file():
            die(f"artifact entry dist/server/{ARTIFACT_ENTRY} missing")
        if not (release_dir / "dist" / "server" / "web" / "ssr").is_dir():
            die("web ssr bundle missing")
        if not (release_dir / "dist" / "server" / "web" / "client").is_dir():
            die("web client bundle missing")
        if not (release_dir / "node_modules").is_dir():
            die("node_modules missing from the artifact")
        # No node check here: the host has no node runtime. The native
        # sqlite binding load test runs in CI before the artifact ships.

        # The service runs as $SERVICE; root-owned files from the tarball
        # would break the restart (EACCES on read). The group is looked up
        # because it is not always the same name as the user.
        try:
            pw = getpwnam(SERVICE)
        except KeyError:
            die(f"the service user {SERVICE} does not exist on this host")
        try:
            gid = grp.getgrnam(SERVICE).gr_gid
        except KeyError:
            gid = pw.pw_gid
        for path in [release_dir, *release_dir.rglob("*")]:
            os.chown(path, pw.pw_uid, gid, follow_symlinks=False)

        log(f"flipping current -> releases/{SHA}")
        flip_current(SHA)

        log(f"restarting {UNIT}")
        if restart_unit() != 0:
            warn(f"restart of {UNIT} failed; rolling back to the previous release")
            rollback()
            die(f"restart of {UNIT} failed")

        log("health check")
        ok = False
        for _ in range(HEALTH_ATTEMPTS):
            time.sleep(HEALTH_INTERVAL)
            if health_ok():
                ok = True
                break
        if not ok:
            warn("health check failed; rolling back to the previous release")
            rollback()
            die(f"health check failed after {HEALTH_ATTEMPTS} attempts")

        log("recording the deployed sha")
        SHARED_DIR.mkdir(mode=0o755, parents=True, exist_ok=True)
        STATE_FILE.write_text(f"{SHA}\n")

        log("pruning old releases")
        prune(release_dir)

        result("ok")
        log(f"deployed {SHA} (previous: {PREV_SHA})")
    finally:
        os.close(lock_fd)


if __name__ == "__main__":
    main()
