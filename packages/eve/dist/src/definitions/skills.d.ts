import type { ContextContainer } from "#context/container.js";
import { type ResolvedDynamicDefinition } from "#runtime/types.js";
import { type Definition } from "./definition.js";
/**
 * The agent's own skills: each joins the call's skills, after the dynamic ones, which take a name
 * from them; the ones that aren't deferred are listed in eve's default prompt, as the call has
 * them.
 */
export declare const skills: Definition;
/**
 * A `defineDynamic()` in `agent/skills/`: one skill named after the file, or a map of them. It
 * keeps what the model sees: each skill's name, description, markdown, and a revision of its
 * files, and each joins the call's skills. The files themselves are built again wherever a
 * sandbox needs them, not stored.
 */
export declare function skillDefinition(resolver: ResolvedDynamicDefinition<"skill">): Definition;
/**
 * Queues the writes of skills with supporting files, so the model call never waits for the
 * sandbox; anything that uses the sandbox waits for them. A package already written at its
 * revision to the same sandbox is skipped, and a session with nothing to write or withdraw never
 * touches the sandbox.
 *
 * Files are removed only when no slot holds a skill by that name anymore. A skill that stops
 * returning supporting files keeps them, since the sandbox may already provide them, for example
 * from its snapshot.
 */
export declare function syncDynamicSkillFiles(ctx: ContextContainer): Promise<void>;
