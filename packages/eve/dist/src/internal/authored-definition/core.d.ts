import type { AgentDefinition, AgentBuildDefinition } from "#public/definitions/agent.js";
import type { ScheduleDefinition } from "#public/definitions/schedule.js";
import type { SkillDefinition } from "#public/definitions/skill.js";
import { type AgentPromptCacheDefinition } from "#shared/agent-definition.js";
type NormalizedAgentDefinition = Omit<AgentDefinition, "build"> & {
    build?: {
        externalDependencies?: Readonly<AgentBuildDefinition["externalDependencies"]>;
    };
};
/**
 * Normalizes one authored agent definition into the canonical internal shape.
 *
 * Authored `name` fields are rejected — agent identity is derived at compile
 * time from `manifest.agentId` (package name or app-root basename).
 */
export declare function normalizeAgentDefinition(value: unknown, message: string): Readonly<NormalizedAgentDefinition>;
/** Validates an authored `modelOptions.promptCache` value. */
export declare function normalizeAgentPromptCache(value: unknown, message: string): AgentPromptCacheDefinition;
/**
 * Normalizes one authored instructions definition into the canonical
 * internal shape.
 *
 * Authored `name` fields are rejected — instructions prompt identity is
 * derived from the file path (`instructions.md` or
 * `instructions.{ts,...}`).
 */
export declare function normalizeInstructionsDefinition(value: unknown, message: string): {
    readonly content: string;
    readonly role: "system" | "user";
};
/**
 * Normalizes one authored skill definition into the canonical internal
 * shape.
 *
 * Authored `name` fields are rejected — skill identity is derived from
 * the file path under `agent/skills/`.
 */
export declare function normalizeSkillDefinition(value: unknown, message: string): SkillDefinition;
/**
 * Normalizes one authored schedule definition into the canonical internal
 * shape.
 *
 * Authored `name` fields are rejected — schedule identity is derived from
 * the file path under `agent/schedules/`. Exactly one of `content` (the
 * fire-and-forget agent prompt) or `run` (the cron handler function)
 * must be provided.
 */
export declare function normalizeScheduleDefinition(value: unknown, message: string): ScheduleDefinition;
export {};
