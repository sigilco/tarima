import type { ModelAccessChange } from "#shared/model-connection.js";
import type { AgentInfoResult, Client } from "#client/index.js";
import type { EveCliSetupStepEvent, EveCliSetupTerminalEvent } from "#cli/telemetry/index.js";
import type { OnboardingScreenEvent } from "./setup-commands.js";
import { inspectApplication } from "#services/inspect-application.js";
import { type AgentTUIConversationView } from "./conversation-view.js";
import { type DevBootProgressReporter } from "#internal/dev-boot-progress.js";
import { type PromptCommand, type PromptCommandSpec, type ArgumentTypeaheadCommand } from "./prompt-commands.js";
import type { PromptArgumentSuggestion } from "./argument-typeahead.js";
import { type RemoteConnectionControllerOptions, type RemoteConnectionSnapshot } from "./remote-connection.js";
import type { RemoteAuthFlow } from "./remote-auth.js";
import type { DevelopmentCredentialGate } from "#services/dev-client/credential-gate.js";
import { type BootDetection } from "./setup-issues.js";
import type { SetupFlowRenderer } from "./setup-flow.js";
import type { TraceViewerRenderer } from "./traces/trace-viewer-session.js";
import type { RemoteDevelopmentTarget } from "./target.js";
import type { LogDisplayMode, TuiDisplayOptions } from "./types.js";
import { type TerminalInput, type TerminalOutput } from "./terminal-renderer.js";
import { type VercelStatusEffect, type VercelStatusSnapshot } from "./vercel-status.js";
import { type McpConnectionProbe } from "./mcp-connection-status.js";
import type { detectProjectIdentity } from "#setup/project-resolution.js";
import { getVercelAuthStatus } from "#setup/vercel-project.js";
import type { DevDiagnostics } from "../diagnostics.js";
import type { CommandLifecycle } from "../../shutdown.js";
export type AgentTUISessionOptions = {
    title?: string;
    /**
     * Text to seed the composer's draft with before the user types. Set by the
     * runner for the first prompt when `eve dev --input` is used.
     */
    initialDraft?: string;
    /** Closes the composer without discarding its draft. */
    signal?: AbortSignal;
};
/** One user action from the composer. */
export type AgentTUIInput = 
/** A message or slash command. Messages sent while work runs steer it. */
{
    type: "submit";
    text: string;
}
/** `Esc` or `Ctrl+C` while work runs. */
 | {
    type: "cancel";
}
/** `Ctrl+C` again while cancellation is pending: stop following the turn. */
 | {
    type: "interrupt";
};
/** Where a prompt sits among the requests being answered, and who asked, when that helps. */
export type AgentTUIInputContext = {
    /** 1-based position among the requests answered in a row; the total grows as more arrive. */
    position?: {
        index: number;
        total: number;
    };
    /** The task that asked, named as its transcript lines are. */
    requester?: string;
    /** The task whose run asked; the renderer names it as its task lines do. */
    taskId?: string;
};
export type AgentTUIToolApprovalRequest = {
    approvalId: string;
    toolCallId: string;
    toolName: string;
    /** The server's question for this approval, such as `Approve Deploy release?`. */
    prompt: string;
    input: unknown;
    context?: AgentTUIInputContext;
};
export type AgentTUIToolApprovalResponse = {
    approved: boolean;
    reason?: string;
};
export type AgentTUIInputOption = {
    id: string;
    label: string;
    description?: string;
    style?: "primary" | "danger" | "default";
};
export type AgentTUIInputQuestion = {
    requestId: string;
    prompt: string;
    display: "select" | "text";
    options?: ReadonlyArray<AgentTUIInputOption>;
    allowFreeform?: boolean;
    context?: AgentTUIInputContext;
};
export type AgentTUIInputQuestionResponse = {
    optionId?: string;
    text?: string;
};
export type AgentTUIAgentHeader = {
    name: string;
    serverUrl: string;
    info?: AgentInfoResult;
    localDevelopment?: boolean;
};
export type AgentTUIRenderer = {
    /**
     * Commits the startup card to the transcript before the first prompt and
     * refreshes it after local dev artifact changes. Optional — renderers
     * without a header simply skip it.
     */
    renderAgentHeader?(header: AgentTUIAgentHeader): void;
    /** Keeps preliminary connection diagnostics out of the startup presentation. */
    setStartupPhase?(phase: "starting" | "connecting" | "updating" | undefined): void;
    /**
     * Commits a single informational line to the transcript. Used for session
     * recovery and slash-command results. Optional.
     */
    renderNotice?(text: string): void;
    /**
     * Puts back a message whose turn was cancelled from outside this prompt, such as `/cancel` from
     * another client, when the composer is empty. Optional.
     */
    restoreDraft?(text: string): void;
    /**
     * Commits the session boundary (`┌── Session restarted, clear context.`)
     * when a dead session is replaced mid-conversation. The old conversation's
     * transcript settles as shown; the next `renderConversation` starts fresh.
     * Optional; renderers without it get the plain notice.
     */
    renderSessionBoundary?(): void;
    /**
     * Commits one development sandbox lifecycle line to the transcript.
     * Optional so non-terminal renderers can ignore local prewarm progress.
     */
    renderSetupWarning?(text: string): void;
    /** Clears the setup attention line once its issue is resolved. */
    clearSetupWarning?(): void;
    /** Commits the startup `/deploy` invocation to the transcript. */
    renderCommandInvocation?(text: string): void;
    finishCommand?(outcome: CommandPresentation): void;
    choosePromptCommand?(commands: readonly PromptCommandSpec[]): Promise<string | undefined>;
    showInfoPanel?(text: string): Promise<void>;
    readonly setupFlow?: SetupFlowRenderer;
    /**
     * The renderer's full-screen local trace viewer, opened by `/traces`.
     * The returned promise resolves when the user closes the viewer.
     */
    readonly traceViewer?: TraceViewerRenderer;
    /**
     * Reads the next composer action. Resolves `undefined` when `signal`
     * aborts and rejects with an interrupt when the user leaves.
     */
    readInput?(options?: AgentTUISessionOptions): Promise<AgentTUIInput | undefined>;
    /** Draws the session's transcript from one conversation snapshot. */
    renderConversation?(view: AgentTUIConversationView): void;
    /** Commits one error block, such as a message the session did not accept. */
    renderError?(title: string, message: string): void;
    /**
     * Reports the server session id backing the conversation — pushed by the
     * runner once a send is accepted, and overwritten when a later session's
     * turn is accepted. Deliberately sticky across `/new` and interrupt
     * recovery: the terminal renderer echoes the LAST session this TUI talked
     * to in the parting line on exit, so an interrupted conversation (whose
     * replacement session never ran a turn) can still be found again
     * (`eve logs`, the session store). Optional.
     */
    setSessionId?(sessionId: string): void;
    readToolApproval?(request: AgentTUIToolApprovalRequest, options?: AgentTUISessionOptions): Promise<AgentTUIToolApprovalResponse>;
    readInputQuestion?(question: AgentTUIInputQuestion, options?: AgentTUISessionOptions): Promise<AgentTUIInputQuestionResponse | undefined>;
    /**
     * The log display mode currently in effect. Paired with
     * {@link setLogDisplayMode}; both are absent on renderers that do not
     * capture process output.
     */
    logDisplayMode?(): LogDisplayMode;
    /**
     * Switches which captured log sources (stdout/stderr) the transcript
     * shows. Captured output is buffered regardless of mode, so a change
     * applies retroactively: hiding removes already-rendered log lines from
     * the transcript and showing restores buffered ones at their original
     * positions. Used by the `/loglevel` command.
     */
    setLogDisplayMode?(mode: LogDisplayMode): void;
    /**
     * Commits any delayed local dev build errors immediately before dispatching
     * a user prompt. Renderers without process-log capture ignore it.
     */
    flushDelayedDevBuildErrors?(): void;
    /**
     * Sets the workspace-scoped Vercel segment of the persistent bottom
     * status line. Pushed by the runner at startup and after Vercel-related
     * setup outcomes. Renderers without a status line ignore it.
     */
    setVercelStatus?(status: VercelStatusSnapshot): void;
    /** Sets the remote deployment badge and its current connection/authentication state. */
    setRemoteConnectionStatus?(status: RemoteConnectionSnapshot): void;
    /**
     * Clears the rendered transcript and resets per-conversation display
     * state, leaving the UI interactive on a fresh screen. Used by the
     * `/new` command to start a new session with a clean slate.
     */
    reset?(): void;
    /**
     * Tears down interactive mode and restores the terminal when the runner's
     * lifecycle ends.
     */
    shutdown?(): void;
    requestInterrupt?(): void;
    exitRequested?(): boolean;
};
export interface PromptCommandHandlerContext {
    readonly renderer: AgentTUIRenderer;
    readonly title: string;
    /** Provider entry authorized by confirmed boot-time model-access evidence. */
    readonly initialModelStep?: "provider";
    readonly onOnboardingScreen?: (input: OnboardingScreenEvent) => void;
    /** Live ChatGPT identity shown only inside model configuration UI. */
    readonly chatGptAccountLabel?: string;
    /** Settles runtime changes before the setup panel releases the screen. */
    readonly settleOutcome?: (outcome: PromptCommandOutcome) => Promise<PromptCommandOutcome>;
    readonly withExclusiveTerminal?: <T>(task: () => Promise<T>) => Promise<T>;
    readonly disabledConnectionReasons?: Readonly<Record<string, string>>;
}
/** One atomic transcript decision for an invocation, including no-output commands. */
export type CommandPresentation = {
    kind: "dismiss";
} | {
    kind: "result";
    message?: string;
    summary?: string;
};
/** What one handled slash command leaves behind for the runner to apply. */
export interface PromptCommandOutcome {
    /** Outcome line rendered under the echoed command; absent renders nothing. */
    message?: string;
    /** The command failed; completed and cancelled commands share the normal settled presentation. */
    failed?: true;
    /** Replaces the echoed invocation once the command settles. */
    summary?: string;
    /** Post-command work after setup settles. */
    effect?: VercelStatusEffect | ModelAccessChange;
    cancelled?: true;
}
export interface PromptCommandHandler {
    handle(command: Extract<PromptCommand, {
        type: "extension";
    }>, context: PromptCommandHandlerContext): Promise<PromptCommandOutcome | undefined>;
}
type TuiStartup = {
    finish(): {
        draft: string;
        queuedPrompt: string | undefined;
    };
};
export type EveTUIRunnerOptions = TuiDisplayOptions & {
    /** Production TUI probe injected by the launcher; omitted in hermetic runners. */
    probeMcpConnection?: McpConnectionProbe;
    /** Configured client for the conversation's sessions and their subagent streams. */
    client: Client;
    renderer?: AgentTUIRenderer;
    screen?: TerminalOutput;
    userInput?: TerminalInput;
    /**
     * Formats a session error (a failed send — e.g. a transport failure or a
     * Vercel Deployment Protection challenge) into the text rendered in the
     * inline error region. Defaults to the error's message. Callers that know
     * about transport-specific challenges (the `eve dev` glue) inject a richer
     * formatter here.
     */
    formatTransportError?: (error: unknown) => string;
    /**
     * Local `eve dev` server URL. When present, normal prompts refresh the
     * runtime artifacts after HMR so the next prompt uses the latest authored
     * artifacts while retaining its logical session.
     */
    serverUrl?: string;
    /** Absolute local application root; omitted for remote `--url` sessions. */
    appRoot?: string;
    /** Seeds the editable prompt buffer for the first prompt. */
    initialInput?: string;
    /** Explicit fresh-agent onboarding handoff from `eve init`. */
    onboard?: boolean;
    /** Reports timestamped steps and terminal result for fresh-agent onboarding. */
    onOnboardingStep?: (input: EveCliSetupStepEvent) => void;
    onOnboardingTerminal?: (input: EveCliSetupTerminalEvent) => void;
    /** Handles non-core slash commands without adding feature branches to the runner. */
    promptCommandHandler?: PromptCommandHandler;
    /** Commands shown in discovery for this local or remote session. */
    availablePromptCommands?: readonly PromptCommandSpec[];
    /** Catalog entries available to inline `/model`, `/add`, and `/login` completion. */
    argumentSuggestions?: (command: ArgumentTypeaheadCommand) => Promise<readonly PromptArgumentSuggestion[]>;
    /** Gives setup subprocesses exclusive terminal and development-host ownership. */
    withExclusiveTerminal?: <T>(task: () => Promise<T>) => Promise<T>;
    /** Remote target and mutable OIDC token source, when connected through `--url`. */
    remote?: {
        readonly target: RemoteDevelopmentTarget;
        readonly credentials: DevelopmentCredentialGate;
        readonly resolveOidcToken: NonNullable<RemoteConnectionControllerOptions["resolveOidcToken"]>;
        readonly resolveDeployment: NonNullable<RemoteConnectionControllerOptions["resolveDeployment"]>;
        /** Test seam for consented deployment access repair. */
        readonly runAuthFlow?: RemoteAuthFlow;
    };
    /** Boot-time installation-state checks; defaults to the built-ins. */
    bootDetections?: readonly BootDetection[];
    /** Test seam for the status line's Vercel link probe; defaults to the real one. */
    detectProjectIdentity?: typeof detectProjectIdentity;
    /** Test seam for `/info`; defaults to the filesystem application inspector. */
    inspectApplication?: typeof inspectApplication;
    /** Test seam for the off-critical-path boot login probe; defaults to the real one. */
    getVercelAuthStatus?: typeof getVercelAuthStatus;
    /** Reports phases from this runner's initial local-dev connection. */
    onBootProgress?: DevBootProgressReporter;
    /** Parent-owned diagnostics recorder; omitted for remote and test renderers. */
    diagnostics?: DevDiagnostics;
    lifecycle?: CommandLifecycle;
    /** Editing-only startup state retained until the final agent header is ready to paint. */
    startup?: TuiStartup;
};
export declare class EveTUIRunner {
    #private;
    constructor(options: EveTUIRunnerOptions);
    run(): Promise<void>;
}
/** Returns the registry address carried by a packaged self-modification terminal handoff. */
export declare function registryHandoffAddress(subagentName: string, toolName: string | undefined, output: unknown): string | undefined;
export {};
