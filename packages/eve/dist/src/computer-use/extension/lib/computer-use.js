import{shellQuote}from"./shell.js";function computerUsePaths(e){let t=e.resolvePath(`computer-use`);return{root:t,driverRoot:e.resolvePath(`.eve-code/computer-use-driver`),driverSocket:`${t}/cua-driver.sock`,latestScreenshot:`${t}/latest.png`,managedBrowserRoot:e.resolvePath(`.eve-code/managed-browser`)}}const TERMINAL_XRESOURCES=`XTerm*background: #0A0A0A.XTerm*foreground: #bbbbbb.XTerm*cursorColor: #bbbbbb.XTerm*pointerColor: #bbbbbb.XTerm*highlightColorMode: true.XTerm*highlightReverse: false.XTerm*highlightColor: #ffffff.XTerm*highlightTextColor: #000000.XTerm*scrollBar: false.XTerm*toolBar: false.XTerm*color0: #000000.XTerm*color1: #e52222.XTerm*color2: #a6e32d.XTerm*color3: #fc951e.XTerm*color4: #c48dff.XTerm*color5: #fa2573.XTerm*color6: #67d9f0.XTerm*color7: #f2f2f2.XTerm*color8: #555555.XTerm*color9: #ff5555.XTerm*color10: #55ff55.XTerm*color11: #ffff55.XTerm*color12: #5555ff.XTerm*color13: #ff55ff.XTerm*color14: #55ffff.XTerm*color15: #ffffff`.split(`.`).join(`
`);function screenshotPath(e,t){let n=computerUsePaths(e);return t===void 0?n.latestScreenshot:`${n.root}/${t}`}function recordingPath(e,t){return`${computerUsePaths(e).root}/${t??`recording-${crypto.randomUUID()}.mp4`}`}function computerUseDriverRequest(e,t){return{action:e,screenshotPath:t}}function computerUseDriverCommand(e){return`node ${shellQuote(`${computerUsePaths(e).driverRoot}/client.mjs`)}`}function computerUseDriverStartCommand(e){let t=computerUsePaths(e),n=`COMPUTER_USE_SOCKET_PATH=${shellQuote(t.driverSocket)}`,r=`COMPUTER_USE_ROOT=${shellQuote(t.root)}`,i=`COMPUTER_USE_REQUEST='{"action":"health"}' ${n} ${`node ${shellQuote(`${t.driverRoot}/client.mjs`)}`}`;return[`set -euo pipefail`,`mkdir -p ${shellQuote(t.root)}`,`if ! ${i} >/dev/null 2>&1; then`,`  rm -f ${shellQuote(t.driverSocket)}`,`  setsid -f env DISPLAY=:99 XCURSOR_SIZE=32 CUA_DRIVER_RS_TELEMETRY_ENABLED=false CUA_DRIVER_RS_UPDATE_CHECK=false ${n} ${r} node ${shellQuote(`${t.driverRoot}/server.mjs`)} </dev/null > ${shellQuote(`${t.root}/cua-driver.log`)} 2>&1`,`fi`,`for _ in $(seq 1 100); do`,`  ${i} >/dev/null 2>&1 && exit 0`,`  sleep 0.1`,`done`,`tail -n 200 ${shellQuote(`${t.root}/cua-driver.log`)} >&2 || true`,`exit 1`].join(`
`)}function computerUseReadyCommand(e){let t=computerUsePaths(e);return[`set -euo pipefail`,`xdpyinfo -display :99 >/dev/null 2>&1`,`DISPLAY=:99 xprop -root _NET_SUPPORTING_WM_CHECK 2>/dev/null | grep -Eq 'window id # 0x[1-9a-f]'`,`COMPUTER_USE_REQUEST='{"action":"health"}' COMPUTER_USE_SOCKET_PATH=${shellQuote(t.driverSocket)} node ${shellQuote(`${t.driverRoot}/client.mjs`)} >/dev/null 2>&1`].join(`
`)}function computerUseDisplayCommand(e){let{root:t}=computerUsePaths(e),n=[xfconfSetCommand(`xsettings`,`/Net/ThemeName`,`string`,`Colloid-Dark`),xfconfSetCommand(`xsettings`,`/Net/PreferDarkTheme`,`bool`,`true`),xfconfSetCommand(`xsettings`,`/Net/IconThemeName`,`string`,`Adwaita`),xfconfSetCommand(`xsettings`,`/Gtk/CursorThemeSize`,`int`,`32`),xfconfSetCommand(`xfwm4`,`/general/theme`,`string`,`Colloid-Dark`),xfconfSetCommand(`xsettings`,`/Gtk/FontName`,`string`,`Geist 10`),xfconfSetCommand(`xsettings`,`/Gtk/MonospaceFontName`,`string`,`GeistMono Nerd Font 10`),xfconfSetCommand(`xfwm4`,`/general/button_layout`,`string`,`CHM|`),xfconfSetCommand(`xfwm4`,`/general/title_alignment`,`string`,`center`),xfconfSetCommand(`xfwm4`,`/general/title_font`,`string`,`Geist Medium 11`),xfconfSetCommand(`xfwm4`,`/general/show_dock_shadow`,`bool`,`false`),xfconfSetCommand(`xfwm4`,`/general/shadow_opacity`,`int`,`35`)];return[`set -euo pipefail`,`command -v Xvfb >/dev/null && command -v xfwm4 >/dev/null || exit 0`,`mkdir -p ${t}`,`if ! xdpyinfo -display :99 >/dev/null 2>&1; then`,`  setsid -f Xvfb :99 -screen 0 1920x1080x24 -ac +extension RANDR > ${t}/xvfb.log 2>&1`,`fi`,`for _ in $(seq 1 50); do`,`  xdpyinfo -display :99 >/dev/null 2>&1 && break`,`  sleep 0.1`,`done`,`xdpyinfo -display :99 >/dev/null`,`dbus_output=$(dbus-launch --sh-syntax)`,`eval "$dbus_output"`,...n,`printf '%s' "$DBUS_SESSION_BUS_ADDRESS" > ${t}/dbus-session-address`,`chmod 0600 ${t}/dbus-session-address`,`setsid -f env DISPLAY=:99 DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION_BUS_ADDRESS" XCURSOR_SIZE=32 xfsettingsd --replace > ${t}/xfsettingsd.log 2>&1`,`for _ in $(seq 1 50); do`,`  pgrep -f '[x]fsettingsd' >/dev/null && break`,`  sleep 0.1`,`done`,`if ! pgrep -f '[x]fsettingsd' >/dev/null; then cat ${t}/xfsettingsd.log >&2 || true; echo 'xfsettingsd did not start' >&2; exit 1; fi`,`setsid -f env DISPLAY=:99 DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION_BUS_ADDRESS" XCURSOR_SIZE=32 xfwm4 --replace --compositor=on > ${t}/xfwm4.log 2>&1`,`for _ in $(seq 1 100); do`,`  DISPLAY=:99 xprop -root _NET_SUPPORTING_WM_CHECK 2>/dev/null | grep -Eq 'window id # 0x[1-9a-f]' && break`,`  sleep 0.1`,`done`,`if ! DISPLAY=:99 xprop -root _NET_SUPPORTING_WM_CHECK 2>/dev/null | grep -Eq 'window id # 0x[1-9a-f]'; then`,`  cat ${t}/xfwm4.log >&2 || true`,`  echo 'xfwm4 did not claim the X11 display' >&2`,`  exit 1`,`fi`,`DISPLAY=:99 xsetroot -solid '#000000'`].join(`
`)}function desktopEnvironmentPrefix(e){let{root:t}=computerUsePaths(e);return`export DISPLAY=:99; export DBUS_SESSION_BUS_ADDRESS="$(cat ${t}/dbus-session-address)"; export XCURSOR_SIZE=32`}function xfconfSetCommand(e,t,n,r){return`DISPLAY=:99 xfconf-query -c ${e} -p ${t} --create -t ${n} -s ${shellQuote(r)}`}function computerUseDesktopSizeCommand(e,t){let n={full_hd:`1920x1080`,large_16_9:`1600x900`,social_16_9:`1280x720`}[t];return[desktopEnvironmentPrefix(e),`if xdotool search --onlyvisible --class firefox-esr >/dev/null 2>&1 || xdotool search --onlyvisible --classname ComputerUseTerminalPrimary >/dev/null 2>&1 || xdotool search --onlyvisible --classname ComputerUseTerminalSecondary >/dev/null 2>&1; then`,`  echo 'desktop size must be selected before launching managed windows' >&2`,`  exit 1`,`fi`,`xrandr --fb ${n}`,`xdpyinfo -display :99 | grep -q 'dimensions: *${n} pixels'`,"xdotool mousemove $(( ${dimensions%x*} / 2 )) $(( ${dimensions#*x} / 2 ))",`xsetroot -solid '#000000'`].join(`
`)}function computerUseLaunchCommand(e,t){let n=computerUsePaths(e),r=n.root;switch(t.app){case`xterm`:{let i=t.instance??`primary`,a=i===`primary`?`ComputerUseTerminalPrimary`:`ComputerUseTerminalSecondary`,o=i===`primary`?`Terminal 1`:`Terminal 2`,s=`DISPLAY=:99 xdotool search --onlyvisible --classname ${a}`;return[`mkdir -p ${r}`,`printf '%s\\n' ${shellQuote(TERMINAL_XRESOURCES)} > ${r}/Xresources`,`printf '%s\\n' ${shellQuote(`unset PROMPT_COMMAND; unset CI; export TERM=xterm-256color; export PATH='${n.managedBrowserRoot}:'"$PATH"; export PS1='▲  \\W/ '`)} > ${r}/terminal-rc`,desktopEnvironmentPrefix(e),`xrdb -merge ${r}/Xresources`,`if ! ${s} >/dev/null 2>&1; then`,`  setsid -f env DISPLAY=:99 DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION_BUS_ADDRESS" xterm -name ${a} -title ${shellQuote(o)} -xrm '${a}*background: #0A0A0A' -xrm '${a}*foreground: #bbbbbb' -xrm '${a}*cursorColor: #bbbbbb' -xrm '${a}*highlightColorMode: true' -xrm '${a}*highlightReverse: false' -xrm '${a}*highlightColor: #ffffff' -xrm '${a}*highlightTextColor: #000000' -fa ${shellQuote(`GeistMono Nerd Font`)} -fs 18 -hm -selbg '#ffffff' -selfg '#000000' +bc +sb -e bash --noprofile --rcfile ${r}/terminal-rc -i </dev/null > ${r}/xterm-${i}.log 2>&1`,`fi`,`for _ in $(seq 1 50); do`,`  ${s} >/dev/null 2>&1 && break`,`  sleep 0.1`,`done`,`window=$(${s} | head -n 1)`,`xdotool windowactivate --sync "$window"`,requireWindowDecorationCommand(`"$window"`,`xterm ${i}`),computerUseWindowLayoutCommand(e,`maximized`,`"$window"`)].join(`
`)}case`firefox`:{let n=`${r}/firefox-profile`,i=`DISPLAY=:99 xdotool search --onlyvisible --class firefox-esr`,a=t.url?[`  window=$(${i} | head -n 1)`,`  previous_title=$(DISPLAY=:99 xdotool getwindowname "$window" 2>/dev/null || true)`,`  DISPLAY=:99 xdotool windowactivate --sync "$window"`,`  DISPLAY=:99 xdotool key --clearmodifiers ctrl+l`,`  DISPLAY=:99 xdotool type --clearmodifiers ${shellQuote(t.url)}`,`  DISPLAY=:99 xdotool key --clearmodifiers Return`]:[],o=t.url?[`window=$(${i} | head -n 1)`,`for _ in $(seq 1 50); do`,`  title=$(DISPLAY=:99 xdotool getwindowname "$window" 2>/dev/null || true)`,'  [[ -n "${title}" && "${title}" != "${previous_title}" ]] && break',`  sleep 0.1`,`done`]:[];return[`mkdir -p ${r} ${n}/chrome`,`printf '%s\n' ${shellQuote(`user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("ui.systemUsesDarkTheme", 1);
user_pref("browser.theme.toolbar-theme", 0);
user_pref("browser.theme.content-theme", 0);
user_pref("layout.css.prefers-color-scheme.content-override", 0);
user_pref("privacy.resistFingerprinting", false);
user_pref("browser.tabs.inTitlebar", 0);
user_pref("browser.toolbars.bookmarks.visibility", "never");
user_pref("browser.urlbar.quicksuggest.enabled", false);
user_pref("browser.urlbar.suggest.quicksuggest.nonsponsored", false);
user_pref("browser.urlbar.suggest.quicksuggest.sponsored", false);
user_pref("browser.urlbar.suggest.searches", false);
user_pref("browser.urlbar.suggest.topsites", false);
user_pref("browser.urlbar.suggest.trending", false);
user_pref("browser.urlbar.suggest.history", false);
user_pref("browser.urlbar.suggest.bookmark", false);
user_pref("browser.urlbar.suggest.openpage", false);
user_pref("browser.urlbar.maxRichResults", 0);
user_pref("browser.newtabpage.activity-stream.feeds.topsites", false);
user_pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);`)} > ${n}/user.js`,`printf '%s\n' ${shellQuote(`
@namespace url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");

/* Demo chrome: native title bar, then back/forward and the address bar. */
#TabsToolbar,
#toolbar-menubar,
#PersonalToolbar,
#PanelUI-button,
#fxa-toolbar-menu-button,
#firefox-view-button,
#unified-extensions-button,
#downloads-button,
#home-button,
#library-button,
#nav-bar-overflow-button,
#identity-box,
#tracking-protection-icon-container,
#page-action-buttons {
  display: none !important;
}

#main-window {
  background: #000 !important;
}

#navigator-toolbox {
  background: #111 !important;
  border-radius: 8px 8px 0 0 !important;
  overflow: hidden !important;
}

#nav-bar {
  background: #111 !important;
  border: 0 !important;
  box-shadow: none !important;
  min-height: 42px !important;
  padding: 4px 8px !important;
}

/* Firefox paints its rectangular client surface over XFWM's lower corners.
   Clip the browser content so the black window background forms the radius. */
#browser,
#appcontent,
#tabbrowser-tabbox,
#tabbrowser-tabpanels {
  background: #000 !important;
  border-radius: 0 0 8px 8px !important;
  overflow: hidden !important;
}

#urlbar-background {
  background: #1a1a1a !important;
  border: 1px solid #333 !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}

#urlbar-input,
#urlbar-scheme {
  color: #ededed !important;
}

#back-button,
#forward-button {
  display: flex !important;
  color: #ededed !important;
}
`)} > ${n}/chrome/userChrome.css`,desktopEnvironmentPrefix(e),`if ! ${i} >/dev/null 2>&1; then`,...t.url?[`  previous_title='Mozilla Firefox'`]:[],`  setsid -f env DISPLAY=:99 DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION_BUS_ADDRESS" GTK_THEME=Colloid-Dark firefox-esr --no-remote --new-instance --profile ${n} ${shellQuote(t.url??`about:blank`)} </dev/null > ${r}/firefox.log 2>&1`,...a.length>0?[`else`,...a]:[],`fi`,`for _ in $(seq 1 100); do`,`  ${i} >/dev/null 2>&1 && break`,`  sleep 0.1`,`done`,`${i} >/dev/null`,...o,`window=$(${i} | head -n 1)`,`DISPLAY=:99 xdotool windowactivate --sync "$window"`,requireWindowDecorationCommand(`"$window"`,`Firefox`),computerUseWindowLayoutCommand(e,`maximized`,`"$window"`)].join(`
`)}}}function requireWindowDecorationCommand(e,t){return[`for _ in $(seq 1 50); do`,`  DISPLAY=:99 xprop -id ${e} _NET_FRAME_EXTENTS 2>/dev/null | grep -q '=.*,' && break`,`  sleep 0.1`,`done`,`DISPLAY=:99 xprop -id ${e} _NET_FRAME_EXTENTS 2>/dev/null | grep -q '=.*,' || { echo ${shellQuote(`${t} opened without window-manager decorations`)} >&2; exit 1; }`].join(`
`)}function computerUseFocusCommand(e,t,n=`primary`){let r=t===`firefox`?`xdotool search --onlyvisible --class firefox-esr`:`xdotool search --onlyvisible --classname ${n===`primary`?`ComputerUseTerminalPrimary`:`ComputerUseTerminalSecondary`}`;return[desktopEnvironmentPrefix(e),`window=$(${r} | head -n 1)`,`test -n "$window" || { echo ${shellQuote(`${t} ${n} window is not running`)} >&2; exit 1; }`,`xdotool windowactivate --sync "$window"`].join(`
`)}function computerUseWindowLayoutCommand(e,t,n=`"$(DISPLAY=:99 xdotool getactivewindow)"`){let r={maximized:{height:`"$usable_height"`,width:`"$usable_width"`,x:`24`,y:`24`},left:{height:`"$usable_height"`,width:`"$left_width"`,x:`24`,y:`24`},right:{height:`"$usable_height"`,width:`"$right_width"`,x:`"$right_x"`,y:`24`}}[t];return[desktopEnvironmentPrefix(e),`dimensions=$(xdpyinfo -display :99 | awk '/dimensions:/{print $2; exit}')`,'screen_width="${dimensions%x*}"','screen_height="${dimensions#*x}"',`usable_width=$((screen_width - 48))`,`usable_height=$((screen_height - 48))`,`left_width=$(((usable_width - 12) / 2))`,`right_x=$((24 + left_width + 12))`,`right_width=$((usable_width - left_width - 12))`,`xdotool windowactivate --sync ${n}`,`xdotool windowmove ${n} ${r.x} ${r.y}`,`xdotool windowsize ${n} ${r.width} ${r.height}`].join(`
`)}export{computerUseDesktopSizeCommand,computerUseDisplayCommand,computerUseDriverCommand,computerUseDriverRequest,computerUseDriverStartCommand,computerUseFocusCommand,computerUseLaunchCommand,computerUsePaths,computerUseReadyCommand,computerUseWindowLayoutCommand,recordingPath,screenshotPath};