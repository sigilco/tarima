/**
 * The dev server's port policy, isolated from the Nitro host implementation.
 * `start-development-server.ts` derives its bind-retry walk from these values.
 */
/** The port `eve dev` binds when none is requested. */
export declare const DEFAULT_DEVELOPMENT_SERVER_PORT = 2000;
/** How many consecutive ports the dev server tries past the default before giving up. */
export declare const MAX_DEVELOPMENT_SERVER_PORT_ATTEMPTS = 10;
/** Reads `PORT` as the requested dev server port, or undefined when it is unset or blank. */
export declare function readDevelopmentServerEnvironmentPort(): number | undefined;
/**
 * Lists the ports the dev server tries in order: the requested (or default)
 * port, then the next ones when an occupied port may be skipped.
 */
export declare function resolveDevelopmentServerPorts(input: {
    readonly port: number | string | undefined;
    readonly retryOnAddressInUse: boolean;
}): readonly [number, ...number[]];
