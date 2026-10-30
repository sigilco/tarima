/**
 * Polling helpers for the e2e suites.
 *
 * The chase loop is asynchronous: the engine claims a step, runs the
 * handler, writes the outbox row, the outbox pump sends it, the reply
 * arrives, the parse step runs. A test therefore waits for a condition
 * instead of sleeping a fixed amount of time.
 */

/** Sleep for `ms` milliseconds. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll until `predicate` holds, then return its value.
 *
 * The predicate may be sync or async. Throws with `message` when the
 * timeout elapses, so the failure names the condition that was never
 * met.
 */
export async function waitFor<T>(
  predicate: () => T | undefined | false | null | Promise<T | undefined | false | null>,
  options: { timeoutMs?: number; intervalMs?: number; message?: string } = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const intervalMs = options.intervalMs ?? 50;
  const deadline = Date.now() + timeoutMs;
  let last: unknown;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value as T;
    last = value;
    await delay(intervalMs);
  }
  throw new Error(
    `${options.message ?? "waitFor timed out"} (after ${timeoutMs}ms, last value: ${String(last)})`,
  );
}
