/**
 * Unit tests for scripts/dev-ports.ts — the free-port picker behind
 * `mise run dev`. The probe is injected; no sockets are opened.
 */
import { describe, expect, it } from "vitest";
import { pickFreePort, type PortProbe } from "../../../../scripts/dev-ports";

/** Probe over a fixed set of occupied ports. */
function probeWith(occupied: number[]): PortProbe {
  const set = new Set(occupied);
  return async (port) => !set.has(port);
}

describe("pickFreePort", () => {
  it("returns the default untouched when it is free", async () => {
    const picked = await pickFreePort(3000, probeWith([]));
    expect(picked).toEqual({ port: 3000, relocated: false });
  });

  it("probes upward past occupied ports and flags the relocation", async () => {
    const picked = await pickFreePort(3000, probeWith([3000, 3001, 3002]));
    expect(picked).toEqual({ port: 3003, relocated: true });
  });

  it("stops at the first free port, not the end of the range", async () => {
    const seen: number[] = [];
    const probe: PortProbe = async (port) => {
      seen.push(port);
      return port === 3001;
    };
    const picked = await pickFreePort(3000, probe);
    expect(picked).toEqual({ port: 3001, relocated: true });
    expect(seen).toEqual([3000, 3001]);
  });

  it("throws when every probed port is occupied", async () => {
    await expect(pickFreePort(3000, probeWith([3000, 3001]), 2)).rejects.toThrow(/no free port/);
  });
});
