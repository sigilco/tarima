/**
 * Readiness probes for `mise run dev` / `--preview`.
 *
 * Every probe fetch is bounded by `AbortSignal.timeout` and retried until
 * an overall deadline: a single hung request can stall a probe for at
 * most `requestTimeoutMs`, never for the whole boot. The fetch
 * implementation is injectable so the unit test
 * (apps/api/src/lib/dev-probe.test.ts) never touches the network.
 */

export interface ProbeResponse {
  ok: boolean;
  status: number;
}

export type ProbeFetch = (
  url: string,
  init: { signal: AbortSignal; redirect: "manual" | "follow" },
) => Promise<ProbeResponse>;

export interface ProbeOptions {
  url: string;
  /** Per-request timeout; a hung fetch aborts and counts as a miss. */
  requestTimeoutMs?: number;
  /** Delay between attempts. */
  intervalMs?: number;
  /** Overall deadline across all attempts. */
  deadlineMs?: number;
  /** Return true when the response means "ready". */
  ready: (res: ProbeResponse) => boolean;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: ProbeFetch;
  /** Injectable for tests; defaults to setTimeout. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const defaultFetch: ProbeFetch = (url, init) => fetch(url, init);

/**
 * Poll `url` until `ready(res)` holds or `deadlineMs` elapses.
 * Returns true on ready, false on deadline.
 */
export async function probeUntilReady(opts: ProbeOptions): Promise<boolean> {
  const {
    url,
    requestTimeoutMs = 3000,
    intervalMs = 500,
    deadlineMs = 90_000,
    ready,
    fetchImpl = defaultFetch,
    sleep = defaultSleep,
  } = opts;
  const deadline = Date.now() + deadlineMs;
  for (;;) {
    try {
      const res = await fetchImpl(url, {
        signal: AbortSignal.timeout(requestTimeoutMs),
        redirect: "manual",
      });
      if (ready(res)) return true;
    } catch {
      // refused, aborted, or a non-ok status handled by `ready`
    }
    if (Date.now() >= deadline) return false;
    await sleep(intervalMs);
  }
}
