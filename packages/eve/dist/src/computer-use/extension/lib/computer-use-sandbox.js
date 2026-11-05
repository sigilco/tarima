import{commandFailureDetail}from"./command-failure.js";import{COMPUTER_USE_DRIVER_SOURCES}from"./computer-use-driver-source.js";import{computerUseDisplayCommand,computerUseDriverStartCommand,computerUsePaths,computerUseReadyCommand}from"./computer-use.js";import{shellQuote}from"./shell.js";const COMPUTER_USE_REVALIDATION_KEY=`computer-use:0.12.5:2026-09-17.1`;async function installComputerUse(e){let t=computerUsePaths(e),n=e.resolvePath(`.eve-code/install-computer-use.sh`);await e.run({command:`mkdir -p ${shellQuote(t.driverRoot)}`}),await Promise.all([...Object.entries(COMPUTER_USE_DRIVER_SOURCES).map(([n,r])=>e.writeTextFile({path:`${t.driverRoot}/${n}`,content:r})),e.writeTextFile({path:n,content:computerUseInstallScript(e)})]);let r=await e.run({command:[`set -e`,`if [ "$(id -u)" = 0 ]; then`,`  bash ${shellQuote(n)}`,`elif command -v sudo >/dev/null 2>&1; then`,`  sudo -n bash ${shellQuote(n)}`,`else`,`  echo 'computer-use requires an apt-based sandbox image with root or passwordless sudo' >&2`,`  exit 1`,`fi`].join(`
`)});if(r.exitCode!==0)throw Error(`computer-use installation failed (exit ${r.exitCode}): ${commandFailureDetail(r)}`)}async function startComputerUse(e){let t={TERM:`xterm-256color`},n=await e.run({command:computerUseDisplayCommand(e),env:t});if(n.exitCode!==0)throw Error(`computer-use display startup failed (exit ${n.exitCode}): ${commandFailureDetail(n)}`);let r=await e.run({command:computerUseDriverStartCommand(e),env:t});if(r.exitCode!==0)throw Error(`computer-use driver startup failed (exit ${r.exitCode}): ${commandFailureDetail(r)}`)}async function ensureComputerUse(e,t){(await e.run({command:computerUseReadyCommand(e),signal:t})).exitCode!==0&&await startComputerUse(e)}function computerUseInstallScript(e){let t=computerUsePaths(e);return`#!/usr/bin/env bash
set -euo pipefail

command -v apt-get >/dev/null || {
  echo "computer-use requires an apt-based sandbox image" >&2
  exit 1
}

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl
apt-get clean

install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://packages.mozilla.org/apt/repo-signing-key.gpg \\
  -o /etc/apt/keyrings/packages.mozilla.org.asc
printf '%s\\n' \\
  'Types: deb' \\
  'URIs: https://packages.mozilla.org/apt' \\
  'Suites: mozilla' \\
  'Components: main' \\
  'Architectures: amd64 arm64' \\
  'Signed-By: /etc/apt/keyrings/packages.mozilla.org.asc' \\
  > /etc/apt/sources.list.d/mozilla.sources
printf '%s\\n' \\
  'Package: *' \\
  'Pin: origin packages.mozilla.org' \\
  'Pin-Priority: 1000' \\
  > /etc/apt/preferences.d/mozilla

apt-get update
FIREFOX_ESR_VERSION="$(apt-cache madison firefox-esr | awk '$3 ~ /^140\\./ { print $3; exit }')"
if [[ -z "\${FIREFOX_ESR_VERSION}" ]]; then
  echo "Mozilla's repository does not offer the Firefox ESR 140 line" >&2
  exit 1
fi

DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \\
  at-spi2-core \\
  ca-certificates \\
  curl \\
  dbus-x11 \\
  ffmpeg \\
  fontconfig \\
  gnome-themes-extra \\
  gtk2-engines-murrine \\
  libxi6 \\
  libxkbcommon0 \\
  sassc \\
  x11-utils \\
  xclip \\
  xdotool \\
  xfce4 \\
  xterm \\
  xvfb \\
  xz-utils
apt-get clean
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \\
  "firefox-esr=\${FIREFOX_ESR_VERSION}"
apt-get clean

GEIST_MONO_VERSION=3.4.0
GEIST_MONO_SHA256=43ef3d73cadddea5be746e20c9f27fbaa59ceb106b8b26f7245ba2de2e46b1f6
COLLOID_COMMIT=fd805dbeeacb12f7971b98408c415c3f472e5aef
COLLOID_SHA256=0f19442b9bd1\
e08e93a223518ce70cd2e47e05ed530fd3345c7e79ea75ea5f83
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "\${TEMP_DIR}"' EXIT

curl -fsSL \\
  "https://github.com/ryanoasis/nerd-fonts/releases/download/v\${GEIST_MONO_VERSION}/GeistMono.tar.xz" \\
  -o "\${TEMP_DIR}/geist-mono.tar.xz"
echo "\${GEIST_MONO_SHA256}  \${TEMP_DIR}/geist-mono.tar.xz" | sha256sum --check --status
install -d -m 0755 /usr/local/share/fonts/geist-mono
tar -xJf "\${TEMP_DIR}/geist-mono.tar.xz" -C /usr/local/share/fonts/geist-mono \\
  GeistMonoNerdFont-Regular.otf GeistMonoNerdFont-Bold.otf
fc-cache -f

curl -fsSL \\
  "https://github.com/vinceliuice/Colloid-gtk-theme/archive/\${COLLOID_COMMIT}.tar.gz" \\
  -o "\${TEMP_DIR}/colloid.tar.gz"
echo "\${COLLOID_SHA256}  \${TEMP_DIR}/colloid.tar.gz" | sha256sum --check --status
mkdir -p "\${TEMP_DIR}/colloid"
tar -xzf "\${TEMP_DIR}/colloid.tar.gz" -C "\${TEMP_DIR}/colloid" --strip-components=1
(
  cd "\${TEMP_DIR}/colloid"
  ./install.sh -d /usr/share/themes -n Colloid -t default -c dark --tweaks black
  SRC_DIR="$(pwd)/src"
  source ./assets.sh
  blackness=true
  colorscheme=false
  normal=false
  make_assets /usr/share/themes Colloid '' -Dark '' '' ''
  test -f /usr/share/themes/Colloid-Dark/xfwm4/close-active.svg
  test -f /usr/share/themes/Colloid-Dark/xfwm4/hide-active.svg
  test -f /usr/share/themes/Colloid-Dark/xfwm4/maximize-active.svg
)

install -d -m 0755 ${shellQuote(t.managedBrowserRoot)}
cat >${shellQuote(`${t.managedBrowserRoot}/xdg-open`)} <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
url="\${1:-}"
[[ "\${url}" =~ ^https?:// ]] || { echo "managed xdg-open accepts HTTP(S) URLs only" >&2; exit 2; }
export DISPLAY=:99
window="$(xdotool search --onlyvisible --class firefox-esr | head -n 1)"
[[ -n "\${window}" ]] || { echo "managed Firefox is not running" >&2; exit 1; }
xdotool windowactivate --sync "\${window}"
xdotool key --clearmodifiers ctrl+l
xdotool type --clearmodifiers --delay 1 "\${url}"
xdotool key --clearmodifiers Return
EOF
chmod 0755 ${shellQuote(`${t.managedBrowserRoot}/xdg-open`)}
ln -sfn xdg-open ${shellQuote(`${t.managedBrowserRoot}/x-www-browser`)}
ln -sfn xdg-open ${shellQuote(`${t.managedBrowserRoot}/sensible-browser`)}

npm install --prefix ${shellQuote(t.driverRoot)} --ignore-scripts --no-audit --no-fund
apt-get clean
rm -rf /var/lib/apt/lists/*
`}export{COMPUTER_USE_REVALIDATION_KEY,ensureComputerUse,installComputerUse,startComputerUse};