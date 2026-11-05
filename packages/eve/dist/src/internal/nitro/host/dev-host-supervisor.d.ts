import { type Server } from "node:http";
/** One built host: a worker entry plus the workspace its workers read. */
export interface DevHost {
    /** Removes the host's workspace once no worker started from it is left. */
    readonly dispose?: () => Promise<void>;
    readonly entry: string;
    readonly workerData: Readonly<Record<string, unknown>>;
}
/** The part of the supervisor the rebuild coordinator drives. */
export interface DevHostSwitch {
    /** Boots a spare worker from the current host for the next {@link recycle}. */
    prepareSpare(): void;
    /**
     * Moves to a fresh worker on the current host. Node never unloads a module,
     * so a worker keeps every generation it imported; a fresh one loads only
     * the active generation.
     */
    recycle(): Promise<void>;
    /**
     * Moves to a ready worker started from `host`. Rejects, and leaves the
     * current worker serving, when the candidate fails readiness.
     */
    swapTo(host: DevHost): Promise<void>;
}
export interface DevServerListener {
    close(): Promise<void>;
    readonly node: {
        readonly server: Server;
    };
    ready(): Promise<void>;
    readonly url: string | undefined;
}
interface DevServerLogger {
    error(message: unknown, ...details: unknown[]): unknown;
}
/**
 * eve's development server: it answers parent-owned control routes, and
 * forwards everything else to one worker through env-runner's
 * `RunnerManager`. A swap waits for the candidate to be ready, and the
 * retired worker keeps serving the requests and WebSockets it already
 * admitted, however long a streaming turn takes, before it shuts down.
 */
export declare class DevHostSupervisor implements DevHostSwitch {
    #private;
    constructor(logger?: DevServerLogger);
    setControlHandler(handler: (request: Request) => Promise<Response | undefined>): void;
    /**
     * Enables signed client-address metadata on forwarded requests. Without it
     * a worker only sees the parent's loopback hop as the peer address.
     */
    setClientAddressSecret(secret: string): void;
    swapTo(host: DevHost): Promise<void>;
    recycle(): Promise<void>;
    prepareSpare(): void;
    listen(input: {
        readonly hostname: string;
        readonly port: number;
    }): DevServerListener;
    close(): Promise<void>;
}
export {};
