import type { SessionAuth, SessionParent, SessionTurn } from "#context/keys.js";
import type { SandboxProviderRuntime } from "#sandbox/provider.js";
import type { RuntimeSandboxSession, SandboxSession } from "#shared/sandbox-session.js";
declare const ENVIRONMENT: unique symbol;
declare const PROVIDER_RUNTIME: unique symbol;
export interface SandboxSelectorContext {
    readonly session: {
        readonly auth: SessionAuth;
        readonly id: string;
        readonly parent?: SessionParent;
        readonly turn: SessionTurn;
    };
}
export type SandboxSelector = (context: SandboxSelectorContext) => Promise<RuntimeSandboxSession> | RuntimeSandboxSession;
export type SandboxOpenArguments<Options> = Options extends undefined ? [] : Record<never, never> extends Options ? [options?: Options] : [options: Options];
export interface SandboxEnvironmentIdentity {
    readonly [ENVIRONMENT]: true;
    /** A {@link SandboxProviderRuntime}, opaque so the public type does not carry core internals. */
    readonly [PROVIDER_RUNTIME]: unknown;
    readonly provider: string;
}
export interface SandboxEnvironment<Options extends object | undefined = object, Session extends SandboxSession = SandboxSession> extends SandboxEnvironmentIdentity {
    open(...args: SandboxOpenArguments<Options>): Promise<RuntimeSandboxSession<Session>>;
}
interface ConstructorRuntime {
    open(input: {
        readonly environment: object;
        readonly options: object | undefined;
        readonly provider: SandboxProviderRuntime;
    }): Promise<RuntimeSandboxSession>;
}
export declare function createSandboxEnvironment<Options extends object | undefined = object, Session extends SandboxSession = SandboxSession>(runtime: SandboxProviderRuntime): SandboxEnvironment<Options, Session>;
export declare function getSandboxEnvironmentRuntime(environment: SandboxEnvironmentIdentity): SandboxProviderRuntime;
export declare function bindSandboxEnvironment(selector: SandboxSelector, environment: SandboxEnvironmentIdentity): SandboxSelector;
export declare function getBoundSandboxEnvironment(value: unknown): SandboxEnvironmentIdentity | undefined;
export declare function isSandboxEnvironment(value: unknown): value is SandboxEnvironmentIdentity;
export declare function runWithSandboxConstructorRuntime<T>(runtime: ConstructorRuntime, callback: () => Promise<T> | T): Promise<T>;
export {};
