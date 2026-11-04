#!/usr/bin/env python3
"""Tests for deploy/scripts/tarima-deploy.py.

Run with:

    python3 -m unittest discover deploy/tests

The script is exercised against a temp APP_ROOT with the systemd unit
and the health check stubbed out, so the release swap, the rollback and
the result line are covered without touching a real host.

The rollback case is the one that matters: a broken artifact must leave
the previous release serving, and the result line must say failed.

Artifacts are packed with real tar. `tar --zstd` is used when the local
tar supports it, else plain tar (the runner accepts either on unpack).
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
DEPLOY_SCRIPT = Path(
    os.environ.get("DEPLOY_SCRIPT", SCRIPT_DIR.parent / "scripts" / "tarima-deploy.py")
)

TAR_FLAGS: list[str] = ["--zstd"]


def _detect_tar() -> None:
    """Prefer `tar --zstd`; fall back to plain tar when unsupported."""
    probe = subprocess.run(
        ["tar", "--zstd", "-cf", "-", "-C", tempfile.gettempdir(), "."],
        capture_output=True,
        timeout=30,
    )
    if probe.returncode != 0:
        TAR_FLAGS.clear()


_detect_tar()


def make_artifact(root: Path, broken: bool = False) -> None:
    """Build a tarball with the layout CI ships."""
    pkg = root / "pkg"
    shutil.rmtree(pkg, ignore_errors=True)
    (pkg / "dist/server/web/ssr").mkdir(parents=True)
    (pkg / "dist/server/web/client").mkdir(parents=True)
    (pkg / "dist/server/index.mjs").write_text("export const ok = 1;\n")
    (pkg / "dist/server/web/ssr/server.js").write_text("ssr\n")
    (pkg / "dist/server/web/client/index.html").write_text("client\n")
    (pkg / "package.json").write_text('{"name":"@tarima/api"}\n')
    if not broken:
        (pkg / "node_modules/better-sqlite3").mkdir(parents=True)
        (pkg / "node_modules/better-sqlite3/package.json").write_text(
            '{"name":"better-sqlite3","version":"13.0.3"}\n'
        )
    subprocess.run(
        ["tar", *TAR_FLAGS, "-cf", str(root / "artifact.tar.zst"), "-C", str(pkg), "."],
        check=True,
    )


def new_root() -> Path:
    """A fresh temp APP_ROOT."""
    root = Path(tempfile.mkdtemp(prefix="tarima-deploy-test-"))
    (root / "app_root").mkdir()
    (root / "shared").mkdir()
    (root / "releases").mkdir()
    return root


def run_deploy(root: Path, sha: str, **extra: str) -> tuple[int, str]:
    """Run the deploy script against a temp root; return (exit, output).

    The health probe is stubbed with HEALTH_CMD: the default one always
    succeeds, so a test that wants a failed health check passes its own.
    """
    env = dict(os.environ)
    env.update(extra)
    env.update(
        APP_ROOT=str(root / "app_root"),
        SHARED_DIR=str(root / "shared"),
        RELEASES_DIR=str(root / "releases"),
        CURRENT_LINK=str(root / "app_root/current"),
        STATE_FILE=str(root / "shared/deployed-sha"),
        LOCK_FILE=str(root / "app_root/.tarima-deploy.lock"),
        ARTIFACT_TAR=str(root / "artifact.tar.zst"),
        UNIT="tarima.service",
        SERVICE=os.environ.get("USER", "nobody"),
        HEALTH_ATTEMPTS="1",
        HEALTH_INTERVAL="0",
        DRY_RUN="1",
    )
    env.setdefault("HEALTH_CMD", "true")
    proc = subprocess.run(
        [sys.executable, str(DEPLOY_SCRIPT), sha],
        env=env,
        capture_output=True,
        text=True,
        timeout=120,
    )
    return proc.returncode, proc.stdout + proc.stderr


def result_lines(out: str) -> list[str]:
    return [line for line in out.splitlines() if "::DEPLOY_RESULT::" in line]


class Base(unittest.TestCase):
    def setUp(self) -> None:
        self.root = new_root()
        self.addCleanup(shutil.rmtree, self.root, True)

    def assertOneResult(self, out: str, expected: str) -> None:
        lines = result_lines(out)
        self.assertEqual(len(lines), 1, f"expected exactly one result line in:\n{out}")
        self.assertEqual(lines[0], expected)

    def assertNotFlipped(self) -> None:
        self.assertFalse(
            (self.root / "app_root/current").is_symlink(),
            "current must not be flipped",
        )


class HappyPath(Base):
    def test_good_artifact_deploys_and_records_sha(self) -> None:
        make_artifact(self.root)
        sha = "aaaaaaa1111111"
        rc, out = run_deploy(self.root, sha)
        self.assertEqual(rc, 0, out)
        self.assertOneResult(out, f"::DEPLOY_RESULT:: status=ok sha={sha} prev_sha=unknown")
        link = self.root / "app_root/current"
        self.assertTrue(link.is_symlink())
        self.assertEqual(os.readlink(link), f"releases/{sha}")
        self.assertEqual((self.root / "shared/deployed-sha").read_text().strip(), sha)


class MissingNodeModules(Base):
    def test_refused_before_flip(self) -> None:
        make_artifact(self.root, broken=True)
        sha = "bbbbbbb2222222"
        rc, out = run_deploy(self.root, sha)
        self.assertNotEqual(rc, 0)
        self.assertIn("node_modules missing from the artifact", out)
        self.assertOneResult(out, f"::DEPLOY_RESULT:: status=failed sha={sha} prev_sha=unknown")
        self.assertNotFlipped()


class HealthFailRollback(Base):
    def test_health_fail_rolls_back(self) -> None:
        sha_c = "ccccccc3333333"
        make_artifact(self.root)
        rc, out = run_deploy(self.root, sha_c)
        self.assertEqual(rc, 0, out)
        self.assertEqual(
            os.readlink(self.root / "app_root/current"), f"releases/{sha_c}"
        )

        # The new release unpacks fine but does not serve: the health
        # check fails and the previous release must keep serving.
        sha_d = "ddddddd4444444"
        make_artifact(self.root)
        rc, out = run_deploy(self.root, sha_d, HEALTH_CMD="false")
        self.assertNotEqual(rc, 0)
        self.assertOneResult(
            out, f"::DEPLOY_RESULT:: status=failed sha={sha_d} prev_sha={sha_c}"
        )
        self.assertEqual(
            os.readlink(self.root / "app_root/current"), f"releases/{sha_c}"
        )
        self.assertEqual((self.root / "shared/deployed-sha").read_text().strip(), sha_c)
        self.assertIn(f"rolled back to {sha_c}", out)


class NonHexSha(Base):
    def test_path_traversal_refused(self) -> None:
        make_artifact(self.root)
        rc, out = run_deploy(self.root, "../../etc/passwd")
        self.assertNotEqual(rc, 0)
        self.assertIn("status=failed", out)
        self.assertIn("non-hex", out)


class MissingArtifact(Base):
    def test_missing_tarball_fails_cleanly(self) -> None:
        rc, out = run_deploy(self.root, "fffffff6666666")
        self.assertNotEqual(rc, 0)
        self.assertIn("artifact tarball missing", out)
        self.assertIn("::DEPLOY_RESULT:: status=failed", out)


class Prune(Base):
    def test_old_releases_pruned_to_five(self) -> None:
        for i in range(1, 8):
            sha = f"{i:07d}"
            make_artifact(self.root)
            rc, out = run_deploy(self.root, sha)
            self.assertEqual(rc, 0, out)
        count = len([p for p in (self.root / "releases").iterdir() if p.is_dir()])
        self.assertLessEqual(count, 5, f"kept {count} releases, expected at most 5")


class LockContention(Base):
    def test_second_run_while_lock_held_fails(self: Any) -> None:
        make_artifact(self.root)
        sha = "aaaaaaa1111111"
        lock_path = self.root / "app_root/.tarima-deploy.lock"
        (self.root / "app_root").mkdir(parents=True, exist_ok=True)
        # Hold the lock the way the script does, then run against it.
        import fcntl

        fd = os.open(lock_path, os.O_CREAT | os.O_WRONLY, 0o644)
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            rc, out = run_deploy(self.root, sha)
            self.assertNotEqual(rc, 0)
            self.assertIn("another deploy is running", out)
            self.assertIn("::DEPLOY_RESULT:: status=failed", out)
        finally:
            os.close(fd)


if __name__ == "__main__":
    unittest.main()
