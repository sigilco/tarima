import type { MessageContent } from "#shared/message-content.js";
import type { Answer } from "#shared/input.js";
/**
 * Tracks local dev runtime-artifact revisions so callers can refresh their
 * presentation before delivering the next turn.
 */
export interface DevelopmentRuntimeArtifactRefresher {
    /**
     * Clears the remembered runtime-artifact revision.
     */
    clear(): void;
    /**
     * Refreshes the artifact revision before a normal turn.
     */
    refresh(input: {
        readonly answers?: readonly Answer[];
        readonly message?: MessageContent;
        readonly onRuntimeArtifactsChanged?: (change: DevelopmentRuntimeArtifactChange) => void | Promise<void>;
    }): Promise<void>;
    /**
     * Forces one rebuild after a local setup action wrote authored source.
     */
    refreshAfterSourceChange(input: {
        readonly onRuntimeArtifactsChanged?: (change: DevelopmentRuntimeArtifactChange) => void | Promise<void>;
    }): Promise<void>;
    /**
     * Checks for a runtime-artifact revision change while the UI is idle.
     */
    refreshIdle(input: {
        readonly onRuntimeArtifactsChanged?: (change: DevelopmentRuntimeArtifactChange) => void | Promise<void>;
    }): Promise<void>;
}
export interface DevelopmentRuntimeArtifactChange {
    readonly previousRevision: string;
    readonly revision: string;
}
/**
 * Creates a revision-aware local dev runtime-artifact refresher.
 */
export declare function createDevelopmentRuntimeArtifactRefresher(input: {
    readonly serverUrl: string;
}): DevelopmentRuntimeArtifactRefresher;
