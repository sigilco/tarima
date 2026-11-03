#!/usr/bin/env bash
# Build the og preview card (1200x630) from scripts/og-preview/og-preview.html.
#
# The card is a static HTML render of the playful landing: same type stack
# (Geist), same paper background, same yellow marker highlight and scribble
# underline, same phone mockup. It is rasterised with headless Chrome so the
# PNG always matches the HTML source, and the fonts come from the same
# @fontsource packages the web app uses.
#
# Usage:
#   scripts/og-preview/build-og-preview.sh
#
# Output:
#   apps/web/public/og-preview.png
set -euo pipefail

cd "$(dirname "$0")/../.."

HTML="scripts/og-preview/og-preview.html"
OUT="apps/web/public/og-preview.png"
W=1200
H=630

if [ ! -f "$HTML" ]; then
  echo "build-og-preview: missing $HTML" >&2
  exit 1
fi

# The Geist variable woff2 the card declares. Copied in at build time from
# the installed @fontsource package so the card renders with the same
# letterforms as the app and the repo does not carry a font binary.
GEIST_NORMAL="$(find node_modules/.pnpm -path '*geist*' -name 'geist-latin-wght-normal.woff2' | head -1)"
GEIST_ITALIC="$(find node_modules/.pnpm -path '*geist*' -name 'geist-latin-wght-italic.woff2' | head -1)"
if [ -z "$GEIST_NORMAL" ] || [ -z "$GEIST_ITALIC" ]; then
  echo "build-og-preview: the @fontsource-variable/geist package is not installed" >&2
  exit 1
fi
cp "$GEIST_NORMAL" scripts/og-preview/geist-latin-wght-normal.woff2
cp "$GEIST_ITALIC" scripts/og-preview/geist-latin-wght-italic.woff2

# Chrome: prefer the playwright-cli browser, then a system Chrome.
CHROME=""
for candidate in \
  "$HOME/Library/Caches/ms-playwright"/*/chrome-mac*/Google\ Chrome\ for\ Testing.app/Contents/MacOS/Google\ Chrome\ for\ Testing \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "$(command -v chromium || true)" \
  "$(command -v google-chrome || true)"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    CHROME="$candidate"
    break
  fi
done

if [ -z "$CHROME" ]; then
  echo "build-og-preview: no Chrome found. Install Chrome or run 'playwright-cli install chrome'." >&2
  exit 1
fi

# A local static server: Chrome's file:// path is fine for the raster pass,
# but the font @font-face references are relative, so serve over http to
# avoid any file:// font restriction.
PORT="${OG_PREVIEW_PORT:-8477}"
python3 -m http.server "$PORT" --directory scripts/og-preview > /dev/null 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
sleep 1

TMP_PNG="$(mktemp -t og-preview).png"
"$CHROME" \
  --headless \
  --disable-gpu \
  --hide-scrollbars \
  --force-device-scale-factor=1 \
  --window-size="${W},${H}" \
  --screenshot="$TMP_PNG" \
  "http://127.0.0.1:${PORT}/og-preview.html" > /dev/null 2>&1

if [ ! -s "$TMP_PNG" ]; then
  echo "build-og-preview: chrome produced no output" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"
# Chrome screenshots at the window size; the card is exactly 1200x630.
cp "$TMP_PNG" "$OUT"
rm -f "$TMP_PNG"

echo "wrote $OUT ($(du -h "$OUT" | cut -f1)) at ${W}x${H}"
