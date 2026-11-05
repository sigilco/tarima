import type { ConnectedModel } from "#shared/model-connection.js";
import { type ModelConnectionSelection } from "#internal/model-auth/store.js";
import type { Prompter } from "#setup/prompter.js";
export declare function environmentConnection(env: Record<string, string | undefined>): ModelConnectionSelection | undefined;
type LoginInput = {
    appRoot: string;
    agentRoot?: string;
    prompter: Prompter;
    automatic?: boolean;
    /** Connection selected by the TUI's `/login <connection>` completion. */
    selected?: ModelConnectionSelection;
    /** TUI callers can omit the redundant picker heading beneath `/login`. */
    connectionMessage?: string;
    signal?: AbortSignal;
    /** Applies writes under one watcher lease and waits for runtime activation. */
    withConnectionUpdate?(task: () => Promise<void>): Promise<void>;
};
type ModelLoginResult = {
    kind: "ready";
    reload: boolean;
    model?: ConnectedModel;
} | {
    kind: "cancelled";
};
export declare function runModelLogin(input: LoginInput): Promise<ModelLoginResult>;
export {};
