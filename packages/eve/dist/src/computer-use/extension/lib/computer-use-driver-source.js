const SERVER_MJS_SOURCE=`import { setTimeout as delay } from "node:timers/promises";
import { execFile, execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmod, rename, rm } from "node:fs/promises";
import { promisify } from "node:util";
import http from "node:http";
import { env } from "node:process";
import { dirname, resolve } from "node:path";

import { CuaDriver } from "@trycua/cua-driver";

import { pointerMotionPlan } from "./pointer-motion.mjs";
import { selectGroundingElements } from "./state.mjs";
import { naturalTypingPlan } from "./typing.mjs";

const socketPath = env.COMPUTER_USE_SOCKET_PATH;
const workspaceRoot = env.COMPUTER_USE_ROOT;
const maxRequestBytes = 32 * 1024;
const maxRequestMs = 120_000;
const maxRecordingMs = 300_000;
const nativeCallTimeoutMs = 10_000;
// Only the queue owner sets this signal; recording finalization deliberately bypasses it.
let requestSignal;
const desktopMargin = 24;
const minimumWindow = { height: 240, width: 480 };
const layoutTolerance = { height: 8, width: 8, x: 4, y: 4 };
const maxClipboardBytes = 10_000;
const driver = await CuaDriver.create({ claudeCodeCompatibility: false });
const execFilePromise = promisify(execFile);
function execFileAsync(file, args, options) {
  return execFilePromise(file, args, {
    timeout: nativeCallTimeoutMs,
    ...options,
    signal: requestSignal,
  });
}

let activeRecording = null;
let queue = Promise.resolve();
let shuttingDown = false;

await rm(socketPath, { force: true });

const server = http.createServer((request, response) => {
  if (shuttingDown) return response.destroy();
  if (request.method !== "POST" || request.url !== "/call") {
    sendJson(response, 404, { error: "not found" });
    return;
  }
  const controller = new AbortController();
  const deadline = Number(request.headers["x-computer-use-deadline"]);
  const timeoutMs = Number.isFinite(deadline)
    ? Math.max(0, Math.min(maxRequestMs, deadline - Date.now()))
    : maxRequestMs;
  const cancel = () =>
    controller.abort(new Error("computer-use request cancelled or deadline exceeded"));
  const timer = setTimeout(cancel, timeoutMs);
  response.once("close", cancel);
  controller.signal.addEventListener("abort", () => response.destroy(), { once: true });
  if (timeoutMs === 0) cancel();
  // Read immediately: a body may finish or disconnect while another call owns the queue.
  const body = readBody(request);
  void body.catch(() => undefined);
  const task = queue.then(async () => {
    controller.signal.throwIfAborted();
    if (shuttingDown) return;
    requestSignal = controller.signal;
    try {
      await handleRequest(await body, response);
    } finally {
      requestSignal = undefined;
    }
  });
  queue = task
    .catch(() => response.destroy())
    .finally(() => {
      clearTimeout(timer);
      response.removeListener("close", cancel);
    });
});

server.listen(socketPath, () => {
  void chmod(socketPath, 0o600);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void shutdown();
  });
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close();
  server.closeAllConnections();
  const timer = setTimeout(() => process.exit(1), nativeCallTimeoutMs * 2);
  let exitCode = 0;
  try {
    await queue;
    if (activeRecording !== null) await stopRecording();
  } catch {
    exitCode = 1;
  } finally {
    try {
      await driver.shutdown();
    } catch {
      exitCode = 1;
    } finally {
      clearTimeout(timer);
      process.exit(exitCode);
    }
  }
}

async function handleRequest(body, response) {
  try {
    const input = JSON.parse(body);
    if (input.action === "health") {
      sendJson(response, 200, { backend: "cua-driver", version: "0.12.5" });
      return;
    }

    validateRequest(input);
    const actionResult = await performAction(input.action);
    const state = await captureState(input.screenshotPath);
    sendJson(response, 200, {
      action: actionResult,
      backend: "cua-driver",
      screenshot: input.screenshotPath,
      state,
      version: "0.12.5",
    });
  } catch (error) {
    if (requestSignal?.aborted && activeRecording !== null) {
      await stopRecording().catch(() => undefined);
    }
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function performAction(action) {
  requestSignal?.throwIfAborted();
  validateActionCoordinates(action);
  if (action.action === "sequence") {
    const results = [];
    try {
      for (const nested of action.actions) {
        const startedAt = performance.now();
        const result = await performAction(nested);
        results.push({
          action: nested.action,
          durationMs: Math.round(performance.now() - startedAt),
          result,
        });
      }
      return results;
    } catch (error) {
      // Never strand the durable driver in an active-recording state when a
      // rehearsed step fails. Preserve the original action error.
      if (activeRecording !== null) await stopRecording().catch(() => undefined);
      throw error;
    }
  }
  switch (action.action) {
    case "screenshot":
      return null;
    case "click":
      await moveCursor(action);
      return click(action, 1);
    case "double_click":
      await moveCursor(action);
      return click(action, 2);
    case "triple_click":
      await moveCursor(action);
      return click(action, 3);
    case "drag":
      return dragCursor(action);
    case "keypress":
      return action.keys.length === 1
        ? call("press_key", {
            scope: "desktop",
            key: normalizeKey(action.keys[0]),
          })
        : call("hotkey", {
            scope: "desktop",
            keys: action.keys.map(normalizeKey),
          });
    case "move":
      return moveCursor(action);
    case "scroll": {
      await call("move_cursor", {
        scope: "desktop",
        x: action.x,
        y: action.y,
      });
      const results = [];
      if (action.scrollY !== 0) {
        results.push(await call("scroll", scrollInput(action.scrollY, "up", "down")));
      }
      if (action.scrollX !== 0) {
        results.push(await call("scroll", scrollInput(action.scrollX, "left", "right")));
      }
      return results;
    }
    case "type":
      return typeText(action);
    case "clipboard_read":
      return readClipboard(action.selection);
    case "clipboard_write":
      return writeClipboard(action.selection, action.text);
    case "wait":
      await sleep(action.durationMs ?? 2_000);
      return null;
    case "arrange_windows":
      return arrangeWindows(action);
    case "record_start":
      return startRecording(action.path);
    case "record_stop":
      return stopRecording();
    default:
      throw new Error(\`unsupported computer-use action: \${String(action.action)}\`);
  }
}

async function captureState(screenshotPath) {
  await call("get_desktop_state", { screenshot_out_file: screenshotPath });
  const pointer = structured(await call("get_cursor_position", {}));
  const screen = x11ScreenSize();
  const windows = structured(await call("list_windows", { on_screen_only: true })).windows;
  const contentWindows = Array.isArray(windows) ? windows.filter(isContentWindow) : [];
  const groundingWindow = contentWindows.toSorted((left, right) => right.z_index - left.z_index)[0];

  let elements = [];
  if (groundingWindow !== undefined) {
    const windowState = structured(
      await call("get_window_state", {
        pid: groundingWindow.pid,
        window_id: groundingWindow.window_id,
        include_screenshot: false,
        max_depth: 20,
        max_elements: 250,
      }),
    );
    if (Array.isArray(windowState.elements)) {
      elements = selectGroundingElements(windowState.elements, {
        width: Number(screen.width) || 1920,
        height: Number(screen.height) || 1080,
      });
    }
  }

  return formatState(groundingWindow, pointer, elements);
}

async function startRecording(path) {
  if (activeRecording !== null) {
    throw new Error("a recording is already active");
  }

  const outputDirectory = \`\${workspaceRoot}/recording-\${randomUUID()}\`;
  const result = await call(
    "start_recording",
    {
      output_dir: outputDirectory,
      record_video: true,
    },
    false,
  );
  activeRecording = {
    outputDirectory,
    outputPath: path,
    stopping: null,
    timer: setTimeout(() => {
      void stopRecording().catch(() => {
        void shutdown();
      });
    }, maxRecordingMs),
  };
  return result;
}

async function stopRecording() {
  if (activeRecording === null) {
    throw new Error("no recording is active");
  }

  const recording = activeRecording;
  if (recording.stopping !== null) return recording.stopping;
  clearTimeout(recording.timer);
  recording.stopping = finalizeRecording(recording);
  return recording.stopping;
}

async function finalizeRecording(recording) {
  try {
    const result = await call("stop_recording", {}, false);
    const output = structured(result);
    const videoPath =
      typeof output.last_video_path === "string"
        ? output.last_video_path
        : recording.outputDirectory + "/recording.mp4";
    await rename(videoPath, recording.outputPath);
    await rm(recording.outputDirectory, { force: true, recursive: true });
    return result;
  } catch (error) {
    void shutdown();
    throw error;
  } finally {
    activeRecording = null;
  }
}

async function call(name, input, cancellable = true) {
  const signal = cancellable ? requestSignal : undefined;
  signal?.throwIfAborted();
  let timer;
  const result = await Promise.race([
    driver.callTool(name, JSON.stringify(input)),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        // Native calls have no abort API. Do not reuse a driver with uncertain in-flight work.
        void shutdown();
        reject(new Error("computer-use native call timed out; restart with startComputerUse"));
      }, nativeCallTimeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
  signal?.throwIfAborted();
  if (result.isError) {
    throw new Error(
      \`Cua \${name} failed\${result.errorCode ? \` (\${result.errorCode})\` : ""}: \${result.text}\`,
    );
  }
  return {
    degraded: result.degraded,
    structuredJson: result.structuredJson,
    text: result.text,
    verified: result.verified,
  };
}

function structured(result) {
  if (result.structuredJson === undefined) return {};
  return JSON.parse(result.structuredJson);
}

function pointerClickInput(x, y, button, count) {
  return {
    scope: "desktop",
    x,
    y,
    button: button === "wheel" ? "middle" : button,
    count,
  };
}

async function moveCursor(action) {
  if (action.movementStyle === undefined) {
    return call("move_cursor", { scope: "desktop", x: action.x, y: action.y });
  }
  const current = structured(await call("get_cursor_position", {}));
  const start = { x: Number(current.x), y: Number(current.y) };
  if (!Number.isFinite(start.x) || !Number.isFinite(start.y)) {
    return call("move_cursor", { scope: "desktop", x: action.x, y: action.y });
  }
  const options = { style: action.movementStyle };
  if (action.durationMs !== undefined) options.durationMs = action.durationMs;
  return followPointerPlan(pointerMotionPlan(start, { x: action.x, y: action.y }, options), "x11");
}

async function dragCursor(action) {
  const start = action.path[0];
  const end = action.path.at(-1);
  if (action.movementStyle === undefined) {
    return call("drag", {
      scope: "desktop",
      from_x: start.x,
      from_y: start.y,
      to_x: end.x,
      to_y: end.y,
      steps: Math.min(200, Math.max(20, action.path.length * 10)),
    });
  }
  const style = action.movementStyle;
  const current = structured(await call("get_cursor_position", {}));
  const currentPoint = { x: Number(current.x), y: Number(current.y) };
  const approach =
    Number.isFinite(currentPoint.x) && Number.isFinite(currentPoint.y)
      ? pointerPlanArgs(pointerMotionPlan(currentPoint, start, { style: "natural" }))
      : ["mousemove", String(start.x), String(start.y)];
  const options = { style };
  if (action.durationMs !== undefined) options.durationMs = action.durationMs;
  const drag = pointerPlanArgs(pointerMotionPlan(start, end, options));
  return xdotool([
    ...approach,
    "sleep",
    "0.025",
    "mousedown",
    "1",
    "sleep",
    "0.030",
    ...drag,
    "sleep",
    "0.030",
    "mouseup",
    "1",
  ]);
}

async function followPointerPlan(plan, backend = "cua") {
  if (backend === "x11") return xdotool(pointerPlanArgs(plan));
  const results = [];
  for (let phaseIndex = 0; phaseIndex < plan.phases.length; phaseIndex += 1) {
    for (const point of plan.phases[phaseIndex]) {
      results.push(await call("move_cursor", { scope: "desktop", x: point.x, y: point.y }));
      if (point.delayMs > 0) await sleep(point.delayMs);
    }
    if (phaseIndex < plan.phases.length - 1 && plan.settleMs > 0) await sleep(plan.settleMs);
  }
  if (plan.phases.length === 1 && plan.settleMs > 0) await sleep(plan.settleMs);
  return results;
}

function pointerPlanArgs(plan) {
  const args = [];
  for (let phaseIndex = 0; phaseIndex < plan.phases.length; phaseIndex += 1) {
    for (const point of plan.phases[phaseIndex]) {
      args.push("mousemove", String(point.x), String(point.y));
      if (point.delayMs > 0) args.push("sleep", (point.delayMs / 1000).toFixed(3));
    }
    if (phaseIndex < plan.phases.length - 1 && plan.settleMs > 0) {
      args.push("sleep", (plan.settleMs / 1000).toFixed(3));
    }
  }
  if (plan.phases.length === 1 && plan.settleMs > 0) {
    args.push("sleep", (plan.settleMs / 1000).toFixed(3));
  }
  return args;
}

async function xdotool(args) {
  const plannedSleepMs = args.reduce(
    (total, value, index) => (args[index - 1] === "sleep" ? total + Number(value) * 1000 : total),
    0,
  );
  const timeout = Math.max(2_000, Math.ceil(plannedSleepMs + 1_500));
  const result = await execFileAsync("xdotool", args, { env: displayEnv(), timeout });
  return {
    plannedSleepMs: Math.round(plannedSleepMs),
    stderr: result.stderr,
    stdout: result.stdout,
  };
}

function typingPlan(action) {
  if (action.typingStyle === "natural") return naturalTypingPlan(action.text);
  return [...new Intl.Segmenter().segment(action.text)].map(({ segment }) => ({
    grapheme: segment,
    delayMs: action.typingDelayMs ?? 0,
  }));
}

function validateTypingBudget(actions) {
  let characters = 0;
  let calls = 0;
  let delayMs = 0;
  for (const action of actions) {
    if (action.action !== "type") continue;
    if (typeof action.text !== "string" || action.text.length > 10_000) {
      throw new Error("typing text must be at most 10000 characters");
    }
    characters += action.text.length;
    if (action.typingStyle === undefined && !action.typingDelayMs) continue;
    const plan = typingPlan(action);
    calls += plan.length;
    delayMs += plan.reduce((total, step) => total + step.delayMs, 0);
  }
  if (characters > 10_000 || calls > 1_000 || delayMs > 30_000) {
    throw new Error(
      "typing budget exceeded: at most 10000 characters, 1000 paced graphemes and 30000ms delay per request; use unpaced typing for longer text",
    );
  }
}

async function typeText(action) {
  if (action.typingStyle === undefined && !action.typingDelayMs) {
    return call("type_text", { scope: "desktop", text: action.text });
  }
  let result;
  let graphemesTyped = 0;
  for (const { grapheme, delayMs } of typingPlan(action)) {
    result = await call("type_text", { scope: "desktop", text: grapheme });
    graphemesTyped += 1;
    if (delayMs > 0) await sleep(delayMs);
  }
  return { graphemesTyped, result };
}

async function click(action, count) {
  if (action.button !== "back" && action.button !== "forward") {
    return call("click", pointerClickInput(action.x, action.y, action.button, count));
  }

  await call("move_cursor", {
    scope: "desktop",
    x: action.x,
    y: action.y,
  });
  const results = [];
  for (let index = 0; index < count; index += 1) {
    results.push(
      await call("hotkey", {
        scope: "desktop",
        keys: ["alt", action.button === "back" ? "left" : "right"],
      }),
    );
  }
  return results;
}

async function readClipboard(selection) {
  try {
    const result = await execFileAsync("xclip", ["-selection", xclipSelection(selection), "-out"], {
      env: displayEnv(),
      maxBuffer: maxClipboardBytes + 1,
    });
    if (Buffer.byteLength(result.stdout) > maxClipboardBytes) {
      throw new Error(\`clipboard content exceeds \${maxClipboardBytes} bytes\`);
    }
    return { selection, text: result.stdout };
  } catch (error) {
    if (error instanceof Error && error.message.includes("clipboard content exceeds")) throw error;
    return { selection, text: "" };
  }
}

async function writeClipboard(selection, text) {
  if (Buffer.byteLength(text) > maxClipboardBytes) {
    throw new Error(\`clipboard content exceeds \${maxClipboardBytes} bytes\`);
  }
  await new Promise((resolve, reject) => {
    const child = execFile("xclip", ["-selection", xclipSelection(selection), "-in"], {
      env: displayEnv(),
      timeout: nativeCallTimeoutMs,
      signal: requestSignal,
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(\`xclip exited \${code}\`)),
    );
    child.stdin.end(text);
  });
  return { bytes: Buffer.byteLength(text), selection };
}

function xclipSelection(selection) {
  return selection === "primary" ? "primary" : "clipboard";
}

async function arrangeWindows(action) {
  const scene = validateWindowScene(action.windows);
  const deadline = Date.now() + action.waitForMs;
  let resolved = null;
  while (resolved === null) {
    const windows = structured(await call("list_windows", { on_screen_only: true })).windows;
    resolved = resolveSceneWindows(scene, Array.isArray(windows) ? windows : []);
    if (resolved !== null) break;
    if (Date.now() >= deadline) {
      throw new Error(
        \`arrange_windows timed out waiting for: \${missingSceneSelectors(scene, Array.isArray(windows) ? windows : []).join(", ")}\`,
      );
    }
    await sleep(100);
  }

  // Resolve the complete scene before mutating any window. A missing selector
  // therefore leaves the existing desktop untouched.
  for (const item of resolved) {
    const windowId = String(item.window.window_id);
    await execFileAsync("xdotool", ["windowactivate", "--sync", windowId], { env: displayEnv() });
    await execFileAsync(
      "xdotool",
      ["windowmove", windowId, String(item.bounds.x), String(item.bounds.y)],
      {
        env: displayEnv(),
      },
    );
    await execFileAsync(
      "xdotool",
      ["windowsize", windowId, String(item.bounds.width), String(item.bounds.height)],
      { env: displayEnv() },
    );
  }

  let verified = null;
  let windows = [];
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = structured(await call("list_windows", { on_screen_only: true })).windows;
    windows = Array.isArray(response) ? response : [];
    verified = resolveSceneWindows(scene, windows);
    if (
      verified !== null &&
      verified.every(({ bounds, window }) => approximatelyEqual(bounds, window))
    ) {
      return verified.map(layoutResult);
    }
    await sleep(100);
  }

  const screenshotPath = \`\${workspaceRoot}/layout-failure-\${Date.now()}.png\`;
  await call("get_desktop_state", { screenshot_out_file: screenshotPath });
  const details =
    verified === null
      ? { stage: "selector_resolution", missing: missingSceneSelectors(scene, windows) }
      : {
          stage: "verification",
          tolerance: layoutTolerance,
          windows: verified.map(layoutResult),
        };
  throw new Error(
    \`arrange_windows failed: \${JSON.stringify({ ...details, screenshot: screenshotPath })}\`,
  );
}

function validateWindowScene(windows) {
  if (!Array.isArray(windows) || windows.length < 1 || windows.length > 4) {
    throw new Error("arrange_windows requires 1 to 4 windows");
  }
  const scene = windows.map((item) => ({ ...item, bounds: regionBounds(item.region) }));
  const selectors = scene.map((item) => selectorLabel(item.selector));
  if (new Set(selectors).size !== selectors.length) {
    throw new Error("arrange_windows selectors must be unique");
  }
  for (let left = 0; left < scene.length; left += 1) {
    for (let right = left + 1; right < scene.length; right += 1) {
      if (overlaps(scene[left].bounds, scene[right].bounds)) {
        throw new Error("arrange_windows regions must not overlap");
      }
    }
  }
  return scene;
}

function desktopBounds() {
  const screen = x11ScreenSize();
  return {
    x: desktopMargin,
    y: desktopMargin,
    width: screen.width - desktopMargin * 2,
    height: screen.height - desktopMargin * 2,
  };
}

function x11ScreenSize() {
  // The X server is the source of truth after set_desktop_size. Avoid CUA's
  // session-oriented get_screen_size contract, which differs from pointer
  // actions and does not accept scope.
  const output = execFileSync("xdpyinfo", ["-display", ":99"], {
    encoding: "utf8",
    timeout: 2_000,
  });
  const match = /dimensions:\\s+(\\d+)x(\\d+) pixels/u.exec(output);
  if (match === null) throw new Error("could not determine desktop dimensions");
  return { width: Number(match[1]), height: Number(match[2]) };
}

function regionBounds(region) {
  if (
    typeof region !== "object" ||
    region === null ||
    ![region.x, region.y, region.width, region.height].every(Number.isFinite) ||
    region.x < 0 ||
    region.y < 0 ||
    region.width <= 0 ||
    region.height <= 0 ||
    region.x + region.width > 1 ||
    region.y + region.height > 1
  ) {
    throw new Error("arrange_windows regions must fit within the desktop");
  }
  const desktop = desktopBounds();
  const left = Math.round(desktop.x + desktop.width * region.x);
  const top = Math.round(desktop.y + desktop.height * region.y);
  const right = Math.round(desktop.x + desktop.width * (region.x + region.width));
  const bottom = Math.round(desktop.y + desktop.height * (region.y + region.height));
  const bounds = { x: left, y: top, width: right - left, height: bottom - top };
  if (bounds.width < minimumWindow.width || bounds.height < minimumWindow.height) {
    throw new Error(
      \`arrange_windows regions must be at least \${minimumWindow.width}x\${minimumWindow.height}\`,
    );
  }
  return bounds;
}

function resolveSceneWindows(scene, windows) {
  const resolved = scene.map((item) => {
    const window = windows.find((candidate) => matchesSelector(candidate, item.selector));
    return window === undefined ? null : { bounds: item.bounds, window };
  });
  return resolved.includes(null) ? null : resolved;
}

function missingSceneSelectors(scene, windows) {
  return scene
    .filter((item) => !windows.some((window) => matchesSelector(window, item.selector)))
    .map((item) => selectorLabel(item.selector));
}

function matchesSelector(window, selector) {
  const identity = \`\${window.app_name ?? ""}\\n\${window.title ?? ""}\`.toLowerCase();
  if (selector.app === "firefox") return identity.includes("firefox");
  const title = selector.instance === "primary" ? "terminal 1" : "terminal 2";
  return identity.includes(title);
}

function selectorLabel(selector) {
  return selector.app === "firefox" ? "firefox" : \`xterm:\${selector.instance}\`;
}

function overlaps(left, right) {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function layoutResult({ bounds, window }) {
  const observed = {
    x: Number(window.x),
    y: Number(window.y),
    width: Number(window.width),
    height: Number(window.height),
  };
  return {
    selector: \`\${window.app_name ?? ""}:\${window.title ?? ""}\`,
    requested: bounds,
    observed,
    delta: {
      x: observed.x - bounds.x,
      y: observed.y - bounds.y,
      width: observed.width - bounds.width,
      height: observed.height - bounds.height,
    },
    tolerance: layoutTolerance,
    title: window.title,
    window_id: window.window_id,
  };
}

function displayEnv() {
  return { ...env, DISPLAY: ":99" };
}

function approximatelyEqual(bounds, window) {
  return (
    Math.abs(bounds.x - window.x) <= layoutTolerance.x &&
    Math.abs(bounds.y - window.y) <= layoutTolerance.y &&
    Math.abs(bounds.width - window.width) <= layoutTolerance.width &&
    Math.abs(bounds.height - window.height) <= layoutTolerance.height
  );
}

function sleep(milliseconds) {
  return delay(milliseconds, undefined, { signal: requestSignal });
}

function scrollInput(delta, negativeDirection, positiveDirection) {
  return {
    scope: "desktop",
    direction: delta < 0 ? negativeDirection : positiveDirection,
    amount: Math.min(50, Math.max(1, Math.round(Math.abs(delta) / 100))),
    by: "line",
  };
}

function normalizeKey(key) {
  const aliases = {
    ARROWDOWN: "down",
    ARROWLEFT: "left",
    ARROWRIGHT: "right",
    ARROWUP: "up",
    CMD: "meta",
    COMMAND: "meta",
    CONTROL: "ctrl",
    DEL: "delete",
    ENTER: "enter",
    ESC: "escape",
    OPTION: "alt",
    RETURN: "enter",
  };
  return aliases[key] ?? key.toLowerCase();
}

function isContentWindow(window) {
  const identity = \`\${window.app_name ?? ""}\\n\${window.title ?? ""}\`.toLowerCase();
  return (
    window.width >= 200 &&
    window.height >= 100 &&
    !identity.includes("xfce4-panel") &&
    !identity.includes("xfdesktop") &&
    window.title !== "Desktop"
  );
}

function formatState(groundingWindow, pointer, elements) {
  const lines = [
    groundingWindow === undefined
      ? "grounding_window\\t(none)"
      : \`grounding_window\\t\${groundingWindow.title} pid=\${groundingWindow.pid} window_id=\${groundingWindow.window_id}\`,
    \`pointer\\tx=\${pointer.x ?? "unknown"} y=\${pointer.y ?? "unknown"}\`,
    "accessibility_elements",
  ];

  for (const element of elements) {
    const frame =
      element.frame === undefined
        ? ""
        : \` x=\${element.frame.x} y=\${element.frame.y} width=\${element.frame.w} height=\${element.frame.h}\`;
    lines.push(
      \`[\${element.element_index}] role=\${element.role}\${frame} label=\${JSON.stringify(element.label ?? "")}\`,
    );
  }
  return lines.join("\\n");
}

function validateActionCoordinates(action) {
  const screen = x11ScreenSize();
  const points = [];
  if (["click", "double_click", "triple_click", "move", "scroll"].includes(action.action)) {
    points.push({ x: action.x, y: action.y });
  }
  if (action.action === "drag") points.push(...action.path);
  for (const point of points) {
    if (
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      point.x < 0 ||
      point.y < 0 ||
      point.x >= screen.width ||
      point.y >= screen.height
    ) {
      throw new Error(
        \`computer-use coordinate is outside the \${screen.width}x\${screen.height} desktop\`,
      );
    }
  }
}

function validateRequest(input) {
  if (typeof input !== "object" || input === null) {
    throw new Error("request must be an object");
  }
  if (!isArtifactPath(input.screenshotPath, ".png")) {
    throw new Error("screenshot path must be a PNG under the computer-use workspace");
  }
  if (typeof input.action !== "object" || input.action === null) {
    throw new Error("request action must be an object");
  }
  const actions = new Set([
    "arrange_windows",
    "click",
    "clipboard_read",
    "clipboard_write",
    "double_click",
    "drag",
    "keypress",
    "move",
    "record_start",
    "record_stop",
    "screenshot",
    "scroll",
    "sequence",
    "triple_click",
    "type",
    "wait",
  ]);
  if (!actions.has(input.action.action)) {
    throw new Error(\`unsupported computer-use action: \${String(input.action.action)}\`);
  }
  if (input.action.action === "sequence") {
    if (
      !Array.isArray(input.action.actions) ||
      input.action.actions.length < 1 ||
      input.action.actions.length > 30
    ) {
      throw new Error("sequence must contain 1 to 30 actions");
    }
    for (const action of input.action.actions) validateNestedSequenceAction(action);
  }
  if (input.action.action === "arrange_windows") validateArrangeWindowsAction(input.action);
  if (input.action.action === "record_start" && !isArtifactPath(input.action.path, ".mp4")) {
    throw new Error("recording path must be an MP4 under the computer-use workspace");
  }
  if (
    ["click", "double_click", "triple_click", "drag", "move"].includes(input.action.action) &&
    "durationMs" in input.action &&
    (!Number.isInteger(input.action.durationMs) ||
      input.action.durationMs < 0 ||
      input.action.durationMs > 2000)
  ) {
    throw new Error("pointer durationMs must be an integer from 0 to 2000");
  }
  validateMovementStyle(input.action, "");
  if (
    input.action.action === "wait" &&
    (!Number.isInteger(input.action.durationMs) ||
      input.action.durationMs < 100 ||
      input.action.durationMs > 10_000)
  ) {
    throw new Error("wait durationMs must be an integer from 100 to 10000");
  }
  validateClipboardOptions(input.action);
  validateTypingOptions(input.action, "");
  validateTypingBudget(input.action.action === "sequence" ? input.action.actions : [input.action]);
}

function validateNestedSequenceAction(action) {
  if (typeof action !== "object" || action === null)
    throw new Error("sequence action must be an object");
  const allowed = new Set([
    "arrange_windows",
    "click",
    "double_click",
    "drag",
    "keypress",
    "move",
    "record_start",
    "record_stop",
    "triple_click",
    "type",
    "wait",
  ]);
  if (!allowed.has(action.action))
    throw new Error(\`unsupported sequence action: \${String(action.action)}\`);
  if (action.action === "arrange_windows") validateArrangeWindowsAction(action);
  if (action.action === "record_start" && !isArtifactPath(action.path, ".mp4")) {
    throw new Error("sequence recording path must be an MP4 under the computer-use workspace");
  }
  if (
    ["click", "double_click", "triple_click", "drag", "move"].includes(action.action) &&
    "durationMs" in action &&
    (!Number.isInteger(action.durationMs) || action.durationMs < 0 || action.durationMs > 2000)
  ) {
    throw new Error("sequence pointer durationMs must be an integer from 0 to 2000");
  }
  validateMovementStyle(action, "sequence ");
  if (
    action.action === "wait" &&
    (!Number.isInteger(action.durationMs) || action.durationMs < 100 || action.durationMs > 10_000)
  ) {
    throw new Error("sequence wait durationMs must be an integer from 100 to 10000");
  }
  if (action.action === "type") validateTypingOptions(action, "sequence ");
}

function validateMovementStyle(action, prefix) {
  if (
    "movementStyle" in action &&
    action.movementStyle !== "natural" &&
    action.movementStyle !== "precision"
  ) {
    throw new Error(\`\${prefix}movementStyle must be natural or precision\`);
  }
  if (
    action.action === "drag" &&
    "movementStyle" in action &&
    action.movementStyle !== "precision"
  ) {
    throw new Error(\`\${prefix}drag movementStyle must be precision\`);
  }
}

function validateClipboardOptions(action) {
  if (
    ["clipboard_read", "clipboard_write"].includes(action.action) &&
    action.selection !== "clipboard" &&
    action.selection !== "primary"
  ) {
    throw new Error("clipboard selection must be clipboard or primary");
  }
  if (
    action.action === "clipboard_write" &&
    (typeof action.text !== "string" || Buffer.byteLength(action.text) > maxClipboardBytes)
  ) {
    throw new Error(\`clipboard text must be at most \${maxClipboardBytes} bytes\`);
  }
}

function validateTypingOptions(action, prefix) {
  if (
    "typingDelayMs" in action &&
    (!Number.isInteger(action.typingDelayMs) ||
      action.typingDelayMs < 0 ||
      action.typingDelayMs > 200)
  ) {
    throw new Error(\`\${prefix}typingDelayMs must be an integer from 0 to 200\`);
  }
  if ("typingStyle" in action && action.typingStyle !== "natural") {
    throw new Error(\`\${prefix}typingStyle must be natural\`);
  }
  if ("typingStyle" in action && "typingDelayMs" in action) {
    throw new Error(\`\${prefix}type action cannot set both typingStyle and typingDelayMs\`);
  }
}

function validateArrangeWindowsAction(action) {
  if (!Number.isInteger(action.waitForMs) || action.waitForMs < 0 || action.waitForMs > 10_000) {
    throw new Error("arrange_windows waitForMs must be an integer from 0 to 10000");
  }
  validateWindowScene(action.windows);
}

function isArtifactPath(value, extension) {
  if (typeof value !== "string" || !value.endsWith(extension)) return false;
  const path = resolve(value);
  return dirname(path) === workspaceRoot;
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxRequestBytes) {
      throw new Error("request exceeds 32 KiB");
    }
  }
  return body;
}

function sendJson(response, statusCode, body) {
  if (response.destroyed) return;
  const json = JSON.stringify(body);
  response.writeHead(statusCode, {
    "content-length": Buffer.byteLength(json),
    "content-type": "application/json",
  });
  response.end(json);
}
`,CLIENT_MJS_SOURCE=`import http from "node:http";
import { env } from "node:process";

const socketPath = env.COMPUTER_USE_SOCKET_PATH;
const body = env.COMPUTER_USE_REQUEST;

if (body === undefined) {
  throw new Error("COMPUTER_USE_REQUEST is required");
}

const deadline = Date.now() + 120_000;
const response = await new Promise((resolve, reject) => {
  const request = http.request(
    {
      socketPath,
      method: "POST",
      path: "/call",
      headers: {
        "content-length": Buffer.byteLength(body),
        "content-type": "application/json",
        "x-computer-use-deadline": String(deadline),
      },
    },
    (incoming) => {
      incoming.on("error", reject);
      incoming.setEncoding("utf8");
      let responseBody = "";
      incoming.on("data", (chunk) => {
        responseBody += chunk;
      });
      incoming.on("end", () => {
        resolve({ body: responseBody, statusCode: incoming.statusCode ?? 500 });
      });
    },
  );
  const timer = setTimeout(
    () => request.destroy(new Error("computer-use request deadline exceeded")),
    Math.max(0, deadline - Date.now()),
  );
  request.once("close", () => clearTimeout(timer));
  request.on("error", reject);
  request.end(body);
});

if (response.statusCode !== 200) {
  process.stderr.write(response.body);
  process.exitCode = 1;
} else {
  process.stdout.write(response.body);
}
`,TYPING_MJS_SOURCE=`const DEMO_TYPING_SPEED = 1.2;
const MIN_DELAY_MS = 35;
const MAX_DELAY_MS = 220;

export function naturalTypingPlan(text) {
  const graphemes = [...new Intl.Segmenter().segment(text)].map(({ segment }) => segment);
  let state = hashText(text) || 1;
  return graphemes.map((grapheme, index) => {
    state = nextState(state);
    return {
      grapheme,
      delayMs: index === graphemes.length - 1 ? 0 : naturalDelay(grapheme, state),
    };
  });
}

function naturalDelay(grapheme, state) {
  const jitter = state / 0x1_0000_0000;
  const range = delayRange(grapheme);
  return Math.round((range.min + (range.max - range.min) * jitter) / DEMO_TYPING_SPEED);
}

function delayRange(grapheme) {
  if (/\\s/u.test(grapheme)) return { min: 75, max: 125 };
  if (/[.!?]/u.test(grapheme)) return { min: 145, max: MAX_DELAY_MS };
  if (/[/|;&]/u.test(grapheme)) return { min: 105, max: 175 };
  if (/[-_=,:]/u.test(grapheme)) return { min: 70, max: 125 };
  return { min: MIN_DELAY_MS, max: 85 };
}

function hashText(text) {
  let hash = 2166136261;
  for (const character of text) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextState(state) {
  let value = state;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}
`,POINTER_MOTION_MJS_SOURCE=`const FRAME_MS = 16;

export function pointerMotionPlan(start, end, options = {}) {
  const style = options.style ?? "natural";
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const durationMs = options.durationMs ?? naturalDuration(distance, style);
  if (distance < 2 || durationMs === 0) {
    return { phases: [[{ ...end, delayMs: 0 }]], settleMs: 0 };
  }

  if (style === "precision" && distance >= 120) {
    const ratio = 0.92 + deterministicUnit(start, end, 7) * 0.04;
    const undershoot = {
      x: Math.round(start.x + (end.x - start.x) * ratio),
      y: Math.round(start.y + (end.y - start.y) * ratio),
    };
    // Cover most of the distance quickly, then spend a disproportionate
    // share of the duration continuously correcting the final 4–8%.
    const firstDuration = Math.round(durationMs * 0.62);
    return {
      phases: [
        bezierPhase(start, undershoot, firstDuration, "natural", 11),
        bezierPhase(undershoot, end, durationMs - firstDuration, "precision", 23),
      ],
      settleMs: 0,
    };
  }

  return {
    phases: [bezierPhase(start, end, durationMs, style, 17)],
    settleMs: style === "natural" ? 15 + Math.round(deterministicUnit(start, end, 31) * 15) : 0,
  };
}

function bezierPhase(start, end, durationMs, style, salt) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const steps = Math.max(2, Math.min(60, Math.round(durationMs / FRAME_MS)));
  const perpendicular = unitPerpendicular(start, end);
  const bendLimit = style === "precision" ? 8 : Math.min(70, distance * 0.09);
  const bend = (deterministicUnit(start, end, salt) * 2 - 1) * bendLimit;
  const c1 = {
    x: start.x + (end.x - start.x) * 0.28 + perpendicular.x * bend,
    y: start.y + (end.y - start.y) * 0.28 + perpendicular.y * bend,
  };
  const c2 = {
    x: start.x + (end.x - start.x) * 0.76 + perpendicular.x * bend * 0.65,
    y: start.y + (end.y - start.y) * 0.76 + perpendicular.y * bend * 0.65,
  };
  const delayMs = durationMs / steps;
  return Array.from({ length: steps }, (_, index) => {
    // This asymmetric timing curve accelerates quickly and eases into the
    // target without the perfectly mirrored feel of smoothstep.
    const progress = (index + 1) / steps;
    const t = 1 - (1 - progress) ** 2.35;
    const point = cubicBezier(start, c1, c2, end, t);
    return {
      x: index === steps - 1 ? end.x : Math.round(point.x),
      y: index === steps - 1 ? end.y : Math.round(point.y),
      delayMs: index === steps - 1 ? 0 : delayMs,
    };
  });
}

function cubicBezier(start, c1, c2, end, t) {
  const inverse = 1 - t;
  return {
    x:
      inverse ** 3 * start.x +
      3 * inverse ** 2 * t * c1.x +
      3 * inverse * t ** 2 * c2.x +
      t ** 3 * end.x,
    y:
      inverse ** 3 * start.y +
      3 * inverse ** 2 * t * c1.y +
      3 * inverse * t ** 2 * c2.y +
      t ** 3 * end.y,
  };
}

function naturalDuration(distance, style) {
  const base = style === "precision" ? 150 : 110;
  const scale = style === "precision" ? 0.35 : 0.28;
  const minimum = style === "precision" ? 180 : 140;
  const maximum = style === "precision" ? 650 : 550;
  return Math.round(Math.min(maximum, Math.max(minimum, base + distance * scale)));
}

function unitPerpendicular(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: -dy / length, y: dx / length };
}

function deterministicUnit(start, end, salt) {
  let value =
    (Math.imul(Math.round(start.x), 73_856_093) ^
      Math.imul(Math.round(start.y), 19_349_663) ^
      Math.imul(Math.round(end.x), 83_492_791) ^
      Math.imul(Math.round(end.y), 2_654_435_761) ^
      salt) >>>
    0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 0x1_0000_0000;
}
`,COMPUTER_USE_DRIVER_SOURCES={"server.mjs":SERVER_MJS_SOURCE,"client.mjs":CLIENT_MJS_SOURCE,"state.mjs":`const MAX_GROUNDING_ELEMENTS = 80;

/**
 * @typedef {{
 *   element_index?: number;
 *   frame?: { h?: number; w?: number; x?: number; y?: number };
 *   label?: unknown;
 *   [key: string]: unknown;
 * }} GroundingElement
 */

/**
 * Keep the model-facing state aligned with the visible desktop screenshot.
 *
 * @param {unknown[]} elements
 * @returns {GroundingElement[]}
 */
export function selectGroundingElements(elements, screen = { width: 1920, height: 1080 }) {
  return elements
    .filter((element) => isVisibleLabeledElement(element, screen))
    .slice(0, MAX_GROUNDING_ELEMENTS);
}

/**
 * @param {unknown} value
 * @returns {value is GroundingElement}
 */
function isVisibleLabeledElement(value, screen) {
  if (typeof value !== "object" || value === null) return false;
  const element = /** @type {GroundingElement} */ (value);
  const frame = element.frame;
  if (typeof element.label !== "string" || element.label.trim().length === 0) return false;
  if (typeof frame !== "object" || frame === null) return false;
  if (
    !Number.isFinite(frame.x) ||
    !Number.isFinite(frame.y) ||
    !Number.isFinite(frame.w) ||
    !Number.isFinite(frame.h)
  ) {
    return false;
  }

  const x = /** @type {number} */ (frame.x);
  const y = /** @type {number} */ (frame.y);
  const width = /** @type {number} */ (frame.w);
  const height = /** @type {number} */ (frame.h);
  return (
    width > 0 &&
    height > 0 &&
    x < screen.width &&
    y < screen.height &&
    x + width > 0 &&
    y + height > 0
  );
}
`,"typing.mjs":TYPING_MJS_SOURCE,"pointer-motion.mjs":POINTER_MOTION_MJS_SOURCE,"package.json":`{
  "name": "computer-use-driver",
  "private": true,
  "type": "module",
  "dependencies": {
    "@trycua/cua-driver": "0.12.5"
  }
}
`};export{CLIENT_MJS_SOURCE,COMPUTER_USE_DRIVER_SOURCES,POINTER_MOTION_MJS_SOURCE,SERVER_MJS_SOURCE,TYPING_MJS_SOURCE};