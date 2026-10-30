#!/usr/bin/env bash
# Post-deploy smoke test for a deployed Tarima environment.
#
# The smoke test proves that the deployment is alive and that a tester
# can get through the door, without sending anything to a third party:
#
#   1. health          the api answers /api/health
#   2. allowlisted otp the login address is accepted and a code is sent
#   3. project create  a project can be created over the machine surface
#
# Steps 2 and 3 are the ones the deploy gate (stream D) runs after a
# release. No channel send happens: the one-time code goes to the tester
# and the project is an empty row.
#
# Usage:
#   scripts/smoke.sh <base-url> <email> [api-key]
#
#   base-url   the deployed origin, e.g. https://tarima.events
#   email      an address on the deployment's allowlist
#   api-key    an optional bearer key with the projects:write scope; when
#              it is given, step 3 creates a project, when it is not,
#              step 3 is skipped and reported as skipped
#
# Exit codes:
#   0  every step that ran passed
#   1  a step failed
#   2  the usage is wrong
set -uo pipefail

BASE_URL="${1:-}"
EMAIL="${2:-}"
API_KEY="${3:-}"

if [ -z "$BASE_URL" ] || [ -z "$EMAIL" ]; then
  echo "usage: scripts/smoke.sh <base-url> <email> [api-key]" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"

failures=0

# Print a step header.
step() {
  echo ""
  echo "== $1"
}

# Fail the run with a message.
fail() {
  echo "FAIL $1" >&2
  failures=$((failures + 1))
}

# The status code of a request, or 000 when the request could not be made.
http_status() {
  local method="$1" path="$2" body="${3:-}" extra_header="${4:-}"
  local args=(-o /dev/null -s -w '%{http_code}' -X "$method" "${BASE_URL}${path}")
  if [ -n "$body" ]; then
    args+=(-H 'content-type: application/json' -d "$body")
  fi
  if [ -n "$extra_header" ]; then
    args+=(-H "$extra_header")
  fi
  curl --max-time 20 --silent "${args[@]}"
}

# The body of a request.
http_body() {
  local method="$1" path="$2" body="${3:-}" extra_header="${4:-}"
  local args=(-s -X "$method" "${BASE_URL}${path}")
  if [ -n "$body" ]; then
    args+=(-H 'content-type: application/json' -d "$body")
  fi
  if [ -n "$extra_header" ]; then
    args+=(-H "$extra_header")
  fi
  curl --max-time 20 --silent "${args[@]}"
}

echo "tarima smoke against ${BASE_URL}"

step "health"
status="$(http_status GET /api/health)"
if [ "$status" = "200" ]; then
  echo "ok   GET /api/health -> 200"
else
  fail "GET /api/health -> ${status}"
fi

step "allowlisted otp for ${EMAIL}"
status="$(http_status POST /auth/request-otp "{\"email\":\"${EMAIL}\"}")"
if [ "$status" = "200" ]; then
  echo "ok   POST /auth/request-otp -> 200 (a code was sent to ${EMAIL})"
elif [ "$status" = "429" ]; then
  fail "POST /auth/request-otp -> 429 (rate limited: too many codes requested for ${EMAIL})"
elif [ "$status" = "403" ] || [ "$status" = "401" ]; then
  fail "POST /auth/request-otp -> ${status} (${EMAIL} is not on the allowlist)"
else
  fail "POST /auth/request-otp -> ${status}"
fi

step "project create"
if [ -z "$API_KEY" ]; then
  echo "skip no api key given, the project create step was not run"
else
  response="$(http_body POST /api/projects '{"name":"smoke"}' "Authorization: Bearer ${API_KEY}")"
  status="$(http_status POST /api/projects '{"name":"smoke"}' "Authorization: Bearer ${API_KEY}")"
  if [ "$status" = "201" ]; then
    echo "ok   POST /api/projects -> 201"
  else
    fail "POST /api/projects -> ${status}: ${response}"
  fi
fi

echo ""
if [ "$failures" -gt 0 ]; then
  echo "smoke: ${failures} step(s) failed"
  exit 1
fi
echo "smoke: all steps passed"
exit 0
