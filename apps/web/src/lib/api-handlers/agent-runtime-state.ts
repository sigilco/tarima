/**
 * Where the in-process eve runtime serves its HTTP channel.
 *
 * Set once at boot by `mountEveRuntime` in `src/server.ts`; the agent
 * turn handler reads it per request so a failed mount answers 503
 * instead of crashing the api.
 */
let eveOrigin: string | undefined;

export function setEveOrigin(origin: string | undefined): void {
  eveOrigin = origin;
}

export function getEveOrigin(): string | undefined {
  return eveOrigin;
}
