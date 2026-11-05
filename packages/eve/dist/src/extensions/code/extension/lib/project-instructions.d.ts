import type { SandboxSession } from "eve/sandbox";
export interface ProjectInstructionsFile {
    readonly path: string;
    readonly content: string;
}
/**
 * Reads the workspace root's `AGENTS.md`, or `CLAUDE.md` when it has none, in
 * one sandbox command: the first non-empty file's path, then at most one byte
 * past the cap so truncation is detectable.
 */
export declare function readProjectInstructions(sandbox: Pick<SandboxSession, "resolvePath" | "run">): Promise<ProjectInstructionsFile | null>;
/** pi's project context format, so models see repository guidance the way coding harnesses show it. */
export declare function formatProjectInstructions(file: ProjectInstructionsFile): string;
