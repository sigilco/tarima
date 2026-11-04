#!/usr/bin/env bash
# Tests for deploy/scripts/tarima-deploy.
#
#   deploy/tests/tarima-deploy.test.sh
#
# The script is exercised against a temp APP_ROOT with the systemd unit
# and the health check stubbed out, so the release swap, the rollback and
# the result line are covered without touching a real host.
#
# The rollback case is the one that matters: a broken artifact must leave
# the previous release serving, and the result line must say failed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_SCRIPT="${DEPLOY_SCRIPT:-$SCRIPT_DIR/../scripts/tarima-deploy}"

TESTS_RUN=0
TESTS_FAILED=0

fail() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo "  FAIL: $*"
}

pass() {
  echo "  ok: $*"
}

assert_eq() {
  local expected="$1" actual="$2" what="$3"
  if [ "$expected" = "$actual" ]; then
    pass "$what"
  else
    fail "$what (expected '$expected', got '$actual')"
  fi
}

assert_contains() {
  local haystack="$1" needle="$2" what="$3"
  case "$haystack" in
    *"$needle"*) pass "$what" ;;
    *) fail "$what (missing '$needle' in: $haystack)" ;;
  esac
}

# make_artifact <dir> [broken]
# Builds a tarball with the layout CI ships.
make_artifact() {
  local dir="$1" broken="${2:-}"
  local pkg="$dir/pkg"
  rm -rf "$pkg"
  mkdir -p "$pkg/dist/server/web/ssr" "$pkg/dist/server/web/client"
  echo "export const ok = 1;" >"$pkg/dist/server/index.mjs"
  echo "ssr" >"$pkg/dist/server/web/ssr/server.js"
  echo "client" >"$pkg/dist/server/web/client/index.html"
  echo '{"name":"@tarima/api"}' >"$pkg/package.json"
  if [ "$broken" != "broken" ]; then
    mkdir -p "$pkg/node_modules/better-sqlite3"
    echo '{"name":"better-sqlite3","version":"13.0.3"}' >"$pkg/node_modules/better-sqlite3/package.json"
  fi
  tar --zstd -cf "$dir/artifact.tar.zst" -C "$pkg" .
}

# new_root: a fresh temp APP_ROOT.
new_root() {
  local root
  root="$(mktemp -d)"
  mkdir -p "$root/app_root" "$root/shared" "$root/releases"
  echo "$root"
}

# run_deploy <root> <sha> [extra env assignments...]
# Runs the deploy script against the temp root and captures stdout+stderr.
# The health probe is stubbed with HEALTH_CMD: the default one always
# succeeds, so a test that wants a failed health check passes its own.
run_deploy() {
  local root="$1" sha="$2"
  shift 2
  env \
    APP_ROOT="$root/app_root" \
    SHARED_DIR="$root/shared" \
    RELEASES_DIR="$root/releases" \
    CURRENT_LINK="$root/app_root/current" \
    STATE_FILE="$root/shared/deployed-sha" \
    LOCK_FILE="$root/app_root/.tarima-deploy.lock" \
    ARTIFACT_TAR="$root/artifact.tar.zst" \
    UNIT="tarima.service" \
    SERVICE="$(id -un)" \
    HEALTH_CMD="true" \
    HEALTH_ATTEMPTS=1 \
    HEALTH_INTERVAL=0 \
    DRY_RUN=1 \
    "$@" \
    bash "$DEPLOY_SCRIPT" "$sha" 2>&1
}

echo "==> deploy script: $DEPLOY_SCRIPT"

# ---------------------------------------------------------------------------
echo "==> case: a good artifact deploys and records the sha"
ROOT="$(new_root)"
make_artifact "$ROOT"
SHA_A="aaaaaaa1111111"
OUT="$(run_deploy "$ROOT" "$SHA_A")"
TESTS_RUN=$((TESTS_RUN + 1))

assert_contains "$OUT" "::DEPLOY_RESULT:: status=ok sha=$SHA_A prev_sha=unknown" "prints one ok result line"
assert_eq "1" "$(grep -c '::DEPLOY_RESULT::' <<<"$OUT")" "prints exactly one result line"
if [ -L "$ROOT/app_root/current" ]; then
  pass "current is a symlink"
else
  fail "current is a symlink"
fi
assert_eq "releases/$SHA_A" "$(readlink "$ROOT/app_root/current")" "current points at the new release"
assert_eq "$SHA_A" "$(cat "$ROOT/shared/deployed-sha")" "the state file records the sha"

# ---------------------------------------------------------------------------
echo "==> case: an artifact without node_modules is refused before the swap"
ROOT2="$(new_root)"
make_artifact "$ROOT2" broken
SHA_B="bbbbbbb2222222"
OUT="$(run_deploy "$ROOT2" "$SHA_B" || true)"
TESTS_RUN=$((TESTS_RUN + 1))

assert_contains "$OUT" "node_modules missing from the artifact" "a missing node_modules is reported"
assert_contains "$OUT" "::DEPLOY_RESULT:: status=failed sha=$SHA_B prev_sha=unknown" "prints one failed result line"
assert_eq "1" "$(grep -c '::DEPLOY_RESULT::' <<<"$OUT")" "prints exactly one result line"
if [ -L "$ROOT2/app_root/current" ]; then
  fail "current is not flipped when the release is refused"
else
  pass "current is not flipped when the release is refused"
fi

# ---------------------------------------------------------------------------
echo "==> case: a release that fails the health check rolls back"
ROOT3="$(new_root)"
make_artifact "$ROOT3"
SHA_C="ccccccc3333333"
run_deploy "$ROOT3" "$SHA_C" >/dev/null || true
assert_eq "releases/$SHA_C" "$(readlink "$ROOT3/app_root/current")" "the first release is serving"

# The new release unpacks fine but does not serve: the health check fails
# and the previous release must keep serving.
make_artifact "$ROOT3"
SHA_D="ddddddd4444444"
OUT="$(run_deploy "$ROOT3" "$SHA_D" HEALTH_CMD="false" || true)"
TESTS_RUN=$((TESTS_RUN + 1))

assert_contains "$OUT" "::DEPLOY_RESULT:: status=failed sha=$SHA_D prev_sha=$SHA_C" "prints one failed result line"
assert_eq "1" "$(grep -c '::DEPLOY_RESULT::' <<<"$OUT")" "prints exactly one result line"
assert_eq "releases/$SHA_C" "$(readlink "$ROOT3/app_root/current")" "current is back on the previous release"
assert_eq "$SHA_C" "$(cat "$ROOT3/shared/deployed-sha")" "the state file still records the previous sha"
assert_contains "$OUT" "rolled back to $SHA_C" "the rollback is reported"

# ---------------------------------------------------------------------------
echo "==> case: an artifact with a broken native binding is refused"
ROOT4="$(new_root)"
make_artifact "$ROOT4" broken
SHA_E="eeeeeee5555555"
# DRY_RUN=0 makes the script check the binding; there is no node runtime
# for a fake package, so the check must fail.
OUT="$(run_deploy "$ROOT4" "$SHA_E" DRY_RUN=0 || true)"
TESTS_RUN=$((TESTS_RUN + 1))
assert_contains "$OUT" "::DEPLOY_RESULT:: status=failed sha=$SHA_E" "a loadable binding is required"
if [ -L "$ROOT4/app_root/current" ]; then
  fail "current is not flipped when the release is refused"
else
  pass "current is not flipped when the release is refused"
fi

# ---------------------------------------------------------------------------
echo "==> case: a non-hex sha is refused"
ROOT5="$(new_root)"
make_artifact "$ROOT5"
OUT="$(run_deploy "$ROOT5" "../../etc/passwd" || true)"
TESTS_RUN=$((TESTS_RUN + 1))
assert_contains "$OUT" "status=failed" "a path-traversal sha is refused"
assert_contains "$OUT" "non-hex" "the refusal names the reason"

# ---------------------------------------------------------------------------
echo "==> case: a missing artifact fails cleanly"
ROOT6="$(new_root)"
OUT="$(run_deploy "$ROOT6" "fffffff6666666" || true)"
TESTS_RUN=$((TESTS_RUN + 1))
assert_contains "$OUT" "artifact tarball missing" "a missing tarball is reported"
assert_contains "$OUT" "::DEPLOY_RESULT:: status=failed" "a missing tarball fails"

# ---------------------------------------------------------------------------
echo "==> case: old releases are pruned"
ROOT7="$(new_root)"
for i in 1 2 3 4 5 6 7; do
  sha="$(printf '%07d' "$i")"
  make_artifact "$ROOT7"
  run_deploy "$ROOT7" "$sha" >/dev/null || true
done
TESTS_RUN=$((TESTS_RUN + 1))
count="$(find "$ROOT7/releases" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
if [ "$count" -le 5 ]; then
  pass "old releases are pruned (kept $count)"
else
  fail "old releases are pruned (kept $count, expected at most 5)"
fi

# ---------------------------------------------------------------------------
echo
if [ "$TESTS_FAILED" -eq 0 ]; then
  echo "all $TESTS_RUN cases passed"
  exit 0
fi
echo "$TESTS_FAILED of $TESTS_RUN cases failed"
exit 1
