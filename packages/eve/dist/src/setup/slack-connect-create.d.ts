import { type ProcessOutputHandler } from "#setup/primitives/process-output.js";
import type { captureVercel, runVercelCaptureStdout } from "#setup/primitives/run-vercel.js";
import { type SlackConnectorRef, type SlackWorkspaceConnection } from "./slack-connect.js";
export interface SlackConnectorCreateDeps {
    captureVercel: typeof captureVercel;
    runVercelCaptureStdout: typeof runVercelCaptureStdout;
    delay?: (ms: number, signal?: AbortSignal) => Promise<void>;
    now?: () => number;
}
type SlackConnectorCreateResult = {
    state: "created";
    via: "cli";
    ref: SlackConnectorRef;
} | {
    state: "created";
    via: "workspace";
    ref: SlackConnectorRef;
    workspace: SlackWorkspaceConnection;
}
/**
 * `detail` is the CLI's own error line, when it printed one. `rejected`
 * proves no connector exists: the CLI reported an error before it printed
 * the browser URL, the only flow that can create a managed connector.
 */
 | {
    state: "failed";
    detail?: string;
    rejected: boolean;
} | {
    state: "unresolved";
};
type Phase = <T>(message: string, task: () => Promise<T>) => Promise<T>;
/**
 * Waits for either the CLI's final browser result or connector metadata proving
 * that Slack connected the workspace. A connector progress event establishes
 * ownership only; the exact detail endpoint establishes workspace completion.
 */
export declare function createSlackConnector(input: {
    deps: SlackConnectorCreateDeps;
    projectRoot: string;
    orgId: string | undefined;
    slug: string;
    onOutput: ProcessOutputHandler;
    signal: AbortSignal | undefined;
    phase: Phase;
    onCreated: (ref: SlackConnectorRef) => void;
    waitForWorkspace: (ref: SlackConnectorRef, signal: AbortSignal) => Promise<SlackWorkspaceConnection | undefined>;
}): Promise<SlackConnectorCreateResult>;
export {};
