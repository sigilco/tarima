#!/usr/bin/env bash
# Post-deploy smoke test for a deployed Tarima environment.
#
# The smoke test proves that the deployment is alive and that a tester
# can get through the door, without sending anything to a third party:
#
#   1. health          the api answers /api/health
#   2. otp request     the login address is accepted and a code is sent
#   3. otp verify      the code is checked and a session is minted
#   4. project create  a project with a brief is created
#   5. brief submit    the brief is submitted for review (stage spec_review)
#
# It runs against a remote BASE_URL exactly like against a local one. The
# only difference is where the one-time code comes from: when the tester
# address is on a loopback domain the code is read back from the api's
# loopback inbox, otherwise a human reads it from the mail and the script
# says what to do.
#
# Usage:
#   scripts/smoke.sh <base-url> <email> [api-key]
#
#   base-url   the deployed origin, e.g. https://tarima.illo.fyi
#   email      an address on the deployment's allowlist
#   api-key    an optional bearer key with the projects:write scope; when
#              it is given, steps 4 and 5 use the bearer surface, when it
#              is not, they use the session cookie from step 3, and with
#              neither, they are skipped
#
# Environment:
#   TARIMA_OTP        the one-time code, when a human read it from the mail
#   LOOPBACK_DOMAINS  comma separated domains whose mail never leaves the
#                     box (default: tarima.test,localhost)
#
# Exit codes:
#   0  every step that ran passed
#   1  a step failed
#   2  the usage is wrong
set -uo pipefail

BASE_URL="${1:-}"
EMAIL="${2:-}"
API_KEY="${3:-}"
LOOPBACK_DOMAINS="${LOOPBACK_DOMAINS:-tarima.test,localhost}"
OTP="${TARIMA_OTP:-}"

if [ -z "$BASE_URL" ] || [ -z "$EMAIL" ]; then
  echo "usage: scripts/smoke.sh <base-url> <email> [api-key]" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"
EMAIL="$(echo "$EMAIL" | tr '[:upper:]' '[:lower:]')"

failures=0
skipped=0
session_cookie=""
project_id=""
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

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

# Report a step that could not run.
skip() {
  echo "skip $1"
  skipped=$((skipped + 1))
}

# Report a step a human has to carry out.
human() {
  echo "HUMAN $1"
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

# True when the address is on a loopback domain, where the api captures
# the mail in the loopback inbox instead of sending it.
is_loopback_address() {
  local domain="${EMAIL##*@}"
  local candidate
  local IFS=','
  for candidate in $LOOPBACK_DOMAINS; do
    candidate="$(echo "$candidate" | tr -d '[:space:]')"
    if [ -z "$candidate" ]; then
      continue
    fi
    if [ "$domain" = "$candidate" ]; then
      return 0
    fi
  done
  return 1
}

# The credential header the machine surface uses: the bearer key when one
# was given, the session cookie otherwise.
auth_header() {
  if [ -n "$API_KEY" ]; then
    echo "Authorization: Bearer ${API_KEY}"
  elif [ -n "$session_cookie" ]; then
    echo "Cookie: ${session_cookie}"
  else
    echo ""
  fi
}

# The path prefix of the project surface for the current credential.
projects_path() {
  if [ -n "$API_KEY" ]; then
    echo "/api/projects"
  else
    echo "/api/ui/projects"
  fi
}

# The six digit code of the newest loopback mail, or empty when there is
# none. The inbox route only answers when the api does not run with
# NODE_ENV=production.
loopback_otp() {
  local body
  body="$(http_body GET "/internal/admin/inbox?to=${EMAIL}")"
  echo "$body" | grep -o '"otp":"[0-9]\{6\}"' | head -1 | sed 's/[^0-9]//g'
}

echo "tarima smoke against ${BASE_URL}"

step "health"
status="$(http_status GET /api/health)"
if [ "$status" = "200" ]; then
  echo "ok   GET /api/health -> 200"
else
  fail "GET /api/health -> ${status}"
fi

step "otp request for ${EMAIL}"
status="$(http_status POST /auth/request-otp "{\"email\":\"${EMAIL}\"}")"
if [ "$status" = "200" ]; then
  echo "ok   POST /auth/request-otp -> 200 (a code was sent to ${EMAIL})"
elif [ "$status" = "429" ]; then
  # The api allows 3 code requests per hour per address. A 429 means a
  # code was already sent, so the verify step below can still run.
  echo "warn POST /auth/request-otp -> 429 (the rate limit is 3 per hour, a code was sent earlier)"
elif [ "$status" = "400" ]; then
  fail "POST /auth/request-otp -> 400 (${EMAIL} is not a valid address)"
else
  fail "POST /auth/request-otp -> ${status}"
fi

step "otp verify"
if [ -n "$OTP" ]; then
  echo "using the code from TARIMA_OTP"
elif is_loopback_address; then
  OTP="$(loopback_otp)"
  if [ -n "$OTP" ]; then
    echo "read the code from the loopback inbox"
  else
    OTP=""
  fi
else
  OTP=""
fi

if [ -z "$OTP" ]; then
  skip "the one-time code could not be read automatically"
  human "read the six digit code from the mail to ${EMAIL} and rerun with TARIMA_OTP=<code> scripts/smoke.sh ${BASE_URL} ${EMAIL}"
else
  # One request does both jobs: the code is single use, so the status and
  # the session cookie have to come from the same call.
  headers_file="$workdir/verify.headers"
  curl --max-time 20 --silent -D "$headers_file" -o "$workdir/verify.out" \
    -X POST -H 'content-type: application/json' \
    -d "{\"email\":\"${EMAIL}\",\"code\":\"${OTP}\"}" \
    "${BASE_URL}/auth/verify-otp"
  status="$(head -1 "$headers_file" | grep -o '[0-9]\{3\}')"
  if [ "$status" = "200" ]; then
    session_cookie="$(grep -i '^set-cookie:' "$headers_file" | sed 's/^[Ss]et-[Cc]ookie: *//' | cut -d';' -f1 | tr -d '\r')"
    echo "ok   POST /auth/verify-otp -> 200"
  elif [ "$status" = "403" ]; then
    fail "POST /auth/verify-otp -> 403 (${EMAIL} is not on the allowlist)"
  elif [ "$status" = "429" ]; then
    fail "POST /auth/verify-otp -> 429 (too many failed verifications for ${EMAIL})"
  elif [ "$status" = "401" ]; then
    fail "POST /auth/verify-otp -> 401 (the code is wrong or expired)"
  elif [ -z "$status" ]; then
    fail "POST /auth/verify-otp could not be made"
  else
    fail "POST /auth/verify-otp -> ${status}"
  fi
fi

step "project create"
header="$(auth_header)"
if [ -z "$header" ]; then
  skip "no api key and no session, so no project was created"
  human "mint an api key with the projects:write scope and rerun, or sign in in a browser and create a project"
else
  body="$(http_body POST "$(projects_path)" '{"name":"smoke","goal":{"brief":{"eventType":"meetup","city":"Malaga","headcount":20,"budgetAmount":5000,"currency":"EUR"}}}' "$header")"
  project_id="$(echo "$body" | grep -o '"id":"[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}"' | head -1 | sed 's/"id":"//; s/"//')"
  if [ -n "$project_id" ]; then
    echo "ok   POST $(projects_path) -> 201 (project ${project_id})"
  else
    fail "POST $(projects_path) -> ${body}"
  fi
fi

step "brief submit"
if [ -z "$project_id" ]; then
  skip "no project to submit the brief of"
elif [ -z "$(auth_header)" ]; then
  skip "no credential to submit the brief with"
else
  status="$(http_status POST "$(projects_path)/${project_id}/stage" '{"to":"spec_review"}' "$(auth_header)")"
  if [ "$status" = "200" ]; then
    echo "ok   POST $(projects_path)/${project_id}/stage -> 200 (the brief is submitted for review)"
  elif [ "$status" = "409" ]; then
    fail "POST $(projects_path)/${project_id}/stage -> 409 (the stage refused spec_review)"
  elif [ "$status" = "401" ] || [ "$status" = "403" ]; then
    fail "POST $(projects_path)/${project_id}/stage -> ${status} (the credential was refused)"
  else
    fail "POST $(projects_path)/${project_id}/stage -> ${status}"
  fi
fi

echo ""
if [ "$failures" -gt 0 ]; then
  echo "smoke: ${failures} step(s) failed, ${skipped} skipped"
  exit 1
fi
echo "smoke: all steps passed, ${skipped} skipped"
exit 0
