import type { DevDiagnostics } from "../diagnostics.js";
import type { AgentTUIInput, AgentTUIInputQuestion, AgentTUIInputQuestionResponse, AgentTUIRenderer, AgentTUISessionOptions, AgentTUIToolApprovalRequest, AgentTUIToolApprovalResponse, CommandPresentation } from "./runner.js";
import type { AgentTUIConversationView } from "./conversation-view.js";
import { type PromptArgumentSuggestion } from "./argument-typeahead.js";
import { type ArgumentTypeaheadCommand, type PromptCommandSpec } from "./prompt-commands.js";
import type { SetupFlowRenderer } from "./setup-flow.js";
import type { AssistantResponseStatsMode, LogDisplayMode, SubagentDisplayMode, TerminalPartDisplayMode } from "./types.js";
import type { AgentInfoResult } from "#client/index.js";
import type { TraceViewerRenderer } from "./traces/trace-viewer-session.js";
import type { VercelStatusSnapshot } from "./vercel-status.js";
import type { RemoteConnectionSnapshot } from "./remote-connection.js";
export type TerminalInput = {
    isTTY?: boolean;
    on(event: "data", listener: (chunk: Buffer) => void): TerminalInput;
    off(event: "data", listener: (chunk: Buffer) => void): TerminalInput;
    resume(): TerminalInput;
    pause(): TerminalInput;
    setRawMode?: (mode: boolean) => TerminalInput;
};
export type TerminalOutput = {
    isTTY?: boolean;
    columns?: number;
    rows?: number;
    write(chunk: string | Uint8Array, encodingOrCallback?: BufferEncoding | ((error?: Error | null) => void), callback?: (error?: Error | null) => void): boolean;
    on(event: "resize", listener: () => void): TerminalOutput;
    off(event: "resize", listener: () => void): TerminalOutput;
};
type TerminalRendererOptions = {
    input?: TerminalInput;
    output?: TerminalOutput;
    tools?: TerminalPartDisplayMode;
    reasoning?: TerminalPartDisplayMode;
    subagents?: SubagentDisplayMode;
    connectionAuth?: TerminalPartDisplayMode;
    assistantResponseStats?: AssistantResponseStatsMode;
    contextSize?: number;
    captureForeignOutput?: boolean;
    logs?: LogDisplayMode;
    color?: boolean;
    unicode?: boolean;
    renderMarkdown?: boolean;
    /** The process's diagnostics recorder (log, dump, stats); local sessions only. */
    diagnostics?: DevDiagnostics;
    /** Slash commands available in this local or remote session. */
    availablePromptCommands?: readonly PromptCommandSpec[];
    /** Catalog entries available to inline `/model`, `/add`, and `/login` completion. */
    argumentSuggestions?: (command: ArgumentTypeaheadCommand) => Promise<readonly PromptArgumentSuggestion[]>;
    onExitRequest?: () => void;
};
type AgentHeaderOptions = {
    name: string;
    serverUrl: string;
    info?: AgentInfoResult;
    localDevelopment?: boolean;
};
export declare class TerminalRenderer implements AgentTUIRenderer {
    #private;
    readonly setupFlow: SetupFlowRenderer;
    /** The `/traces` full-screen viewer; resolves when the user closes it. */
    readonly traceViewer: TraceViewerRenderer;
    constructor(options?: TerminalRendererOptions);
    setStartupPhase(phase: "starting" | "connecting" | "updating" | undefined): void;
    /**
     * Commits the startup agent header (brand mark + resolved configuration) to
     * scrollback before the first prompt. Later calls (dev HMR refreshing fields
     * such as the model) commit a fresh header beneath the existing transcript
     * only when the rendered header actually changed — every source
     * reload re-sends it, and an identical banner repeated per reload is noise.
     * Committed scrollback is never cleared or replayed.
     */
    renderAgentHeader(options: AgentHeaderOptions): void;
    beginStartupDraft(options: {
        initialDraft?: string;
        title: string;
    }): void;
    finishStartupDraft(): {
        draft: string;
        queuedPrompt: string | undefined;
    };
    /**
     * Opens the composer until the user submits, cancels work, or leaves. The
     * composer stays usable while work runs: `Enter` submits (the runner steers),
     * and `Esc` or `Ctrl+C` asks to cancel. Aborting `signal` keeps the draft for
     * the next read, so other input surfaces can briefly take the keyboard.
     */
    readInput(options?: AgentTUISessionOptions): Promise<AgentTUIInput | undefined>;
    /**
     * Reconciles the session's transcript with one conversation snapshot. Blocks
     * keep their position once shown; a block leaves the live region when its
     * part can no longer change.
     */
    renderConversation(view: AgentTUIConversationView): void;
    readToolApproval(request: AgentTUIToolApprovalRequest, options?: AgentTUISessionOptions): Promise<AgentTUIToolApprovalResponse>;
    readInputQuestion(question: AgentTUIInputQuestion, options?: AgentTUISessionOptions): Promise<AgentTUIInputQuestionResponse | undefined>;
    setVercelStatus(status: VercelStatusSnapshot): void;
    setRemoteConnectionStatus(status: RemoteConnectionSnapshot): void;
    reset(): void;
    /**
     * The mid-conversation session boundary: one opening-corner line marking
     * where the server-side context was cut and a fresh session took over.
     */
    renderSessionBoundary(): void;
    /**
     * Commits a single dim informational line to the transcript (e.g. the
     * session-recovery notice after a terminal server failure). No-op when the
     * text is blank.
     */
    renderNotice(text: string): void;
    /** Puts a cancelled turn's message back into an empty composer, with a notice. */
    restoreDraft(text: string): void;
    /**
     * Sets the setup attention line (yellow `⚠`, commands blue) as a live footer
     * element above the prompt. Unlike committed scrollback, it can be cleared:
     * once the underlying issue is fixed (e.g. `/deploy` succeeds) the runner calls
     * {@link clearSetupWarning} and the line disappears rather than lingering
     * stale in the transcript.
     */
    renderSetupWarning(text: string): void;
    /** Removes the setup attention line once its issue is resolved. */
    clearSetupWarning(): void;
    /** Echoes a slash-command invocation that was started without prompt input. */
    renderCommandInvocation(text: string): void;
    /** Lets `/help` select a command without leaving a transcript row. */
    choosePromptCommand(commands: readonly PromptCommandSpec[]): Promise<string | undefined>;
    /** Shows local application metadata without retaining it in the transcript. */
    showInfoPanel(text: string): Promise<void>;
    /** Completes the active command's transcript record in one operation. */
    finishCommand(outcome: CommandPresentation): void;
    /** Last server session id the runner reported; named in the parting line. */
    setSessionId(sessionId: string): void;
    shutdown(): void;
    requestInterrupt(): void;
    exitRequested(): boolean;
    /** Commits one error block, such as a message the session did not accept. */
    renderError(title: string, message: string): void;
    /** The log sources the transcript currently renders. */
    logDisplayMode(): LogDisplayMode;
    /**
     * Switches which captured log sources the transcript shows. Captured
     * output is buffered in the block history regardless of mode, so the
     * committed transcript is re-rendered under the new filter and replayed:
     * hiding removes past log lines, showing restores them at their original
     * positions.
     */
    setLogDisplayMode(mode: LogDisplayMode): void;
    flushDelayedDevBuildErrors(): void;
}
export {};
