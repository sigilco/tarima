import type { SandboxSession } from "#shared/sandbox-session.js";
export declare const MODEL_SKILL_ROOT = "$HOME/.agents/skills";
/**
 * Resolves where skills live in the sandbox: under the probed home when it has
 * one, and under `skills/` in the workspace root when it does not.
 */
export declare function resolveSandboxSkillRoot(input: {
    readonly sandbox: SandboxSession;
}): Promise<string>;
/**
 * Resolves a leading `$HOME` in a model-supplied sandbox path without
 * evaluating any other shell syntax. Skill paths fall back to `skills/` in
 * the workspace root when the sandbox does not expose a usable home
 * directory.
 */
export declare function resolveSandboxModelPath(input: {
    readonly path: string;
    readonly sandbox: SandboxSession;
}): Promise<string>;
export declare function resolveSandboxSkillWritePath(input: {
    readonly name: string;
    readonly relativePath: string;
    readonly sandbox: SandboxSession;
}): Promise<string>;
