/**
 * Unit tests for scripts/dev-probe.ts — the bounded readiness probes
 * behind `mise run dev`. Fetch is injected; no sockets are opened.
 */
import { describe, expect, it } from "vitest";
import { probeUntilReady, type ProbeFetch } from "../../../../scripts/dev-probe";

const noSleep = () => Promise.resolve();

describe("probeUntilReady", () => {
  it("returns true on the first ready response", async () => {
    const fetchImpl: ProbeFetch = async () => ({ ok: true, status: 200 });
    const ready = await probeUntilReady({
      url: "http://x/",
      ready: (res) => res.ok,
      fetchImpl,
      sleep: noSleep,
    });
    expect(ready).toBe(true);
  });

  it("retries past misses until the deadline", async () => {
    let calls = 0;
    const fetchImpl: ProbeFetch = async () => {
      calls++;
      return calls < 3 ? { ok: false, status: 503 } : { ok: true, status: 200 };
    };
    const ready = await probeUntilReady({
      url: "http://x/",
      ready: (res) => res.ok,
      fetchImpl,
      sleep: noSleep,
    });
    expect(ready).toBe(true);
    expect(calls).toBe(3);
  });

  it("a hung request aborts at the request timeout and the probe recovers", async () => {
    let calls = 0;
    const fetchImpl: ProbeFetch = (_url, init) => {
      calls++;
      if (calls === 1) {
        // Mimic a real fetch that never answers but honors the abort
        // signal: the probe must time it out and retry.
        return new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () =>
            reject(new DOMException("The operation timed out.", "TimeoutError")),
          );
        });
      }
      return Promise.resolve({ ok: true, status: 200 });
    };
    const started = Date.now();
    const ready = await probeUntilReady({
      url: "http://x/",
      requestTimeoutMs: 50,
      intervalMs: 10,
      deadlineMs: 5_000,
      ready: (res) => res.ok,
      fetchImpl,
      sleep: noSleep,
    });
    expect(ready).toBe(true);
    expect(calls).toBe(2);
    // The hung attempt cost ~requestTimeoutMs, not the whole deadline.
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it("returns false when nothing is ready by the deadline", async () => {
    const fetchImpl: ProbeFetch = async () => {
      throw new Error("ECONNREFUSED");
    };
    const ready = await probeUntilReady({
      url: "http://x/",
      intervalMs: 5,
      deadlineMs: 30,
      ready: (res) => res.ok,
      fetchImpl,
      sleep: noSleep,
    });
    expect(ready).toBe(false);
  });
});
