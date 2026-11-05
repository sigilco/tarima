/**
 * Where the in-process eve runtime serves its HTTP channel.
 *
 * The mount is asynchronous: `mountEveRuntime` in `src/server.ts` starts
 * the compiled eve runtime, which binds its loopback socket inside the
 * module's top-level await. A request that arrives before the mount
 * settles must wait for it rather than answer 503, so the promise is
 * kept here and the turn handler awaits it.
 */
let eveOrigin: string | undefined;
let eveMount: Promise<string | undefined> | undefined;

/** Records the resolved origin (or a failed mount). */
export function setEveOrigin(origin: string | undefined): void {
  eveOrigin = origin;
}

/** Starts (or returns) the mount; resolves to the origin or undefined. */
export function trackEveMount(mount: Promise<string | undefined>): void {
  eveMount = mount.then((origin) => {
    eveOrigin = origin;
    return origin;
  });
}

/**
 * The origin the eve runtime serves on, waiting for the mount to settle
 * when it is still in flight.
 */
export async function getEveOrigin(): Promise<string | undefined> {
  if (eveOrigin) return eveOrigin;
  if (eveMount) return await eveMount;
  return undefined;
}
