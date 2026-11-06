/**
 * Free-port selection for `mise run dev` / `--preview`.
 *
 * The dev script owns several loopback ports (web, eve runtime). When a
 * default is already bound — another tarima checkout, a stale service —
 * binding silently would either crash the child or, worse, leave the
 * printed URLs pointing at a stranger. `pickFreePort` probes upward from
 * the configured default and reports whether the port moved so the CLI
 * can say so in one line.
 *
 * The probe is injectable so the unit test
 * (apps/api/src/lib/dev-ports.test.ts) never touches the network.
 */
import { connect } from "node:net";

/** Resolves true when nothing accepts TCP connections on `port`. */
export type PortProbe = (port: number) => Promise<boolean>;

/** Real probe: try to connect to 127.0.0.1:<port>; ECONNREFUSED = free. */
export const tcpPortProbe: PortProbe = (port) =>
  new Promise((resolve) => {
    const sock = connect({ port, host: "127.0.0.1" });
    const done = (free: boolean) => {
      sock.destroy();
      resolve(free);
    };
    sock.once("connect", () => done(false));
    sock.once("error", () => done(true));
  });

export interface PickedPort {
  port: number;
  /** True when the configured default was taken and we moved upward. */
  relocated: boolean;
}

/**
 * First free port at or above `start`, probing `start`, `start+1`, ...
 * Throws after `maxAttempts` consecutive occupied ports.
 */
export async function pickFreePort(
  start: number,
  probe: PortProbe = tcpPortProbe,
  maxAttempts = 100,
): Promise<PickedPort> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = start + i;
    if (port > 65535) break;
    if (await probe(port)) return { port, relocated: i > 0 };
  }
  throw new Error(`no free port found in ${start}..${Math.min(start + maxAttempts - 1, 65535)}`);
}
