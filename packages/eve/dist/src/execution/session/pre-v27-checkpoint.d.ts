import { type SessionCheckpoint } from "#execution/session/handoff.js";
import { type SessionProjection } from "#protocol/session-projection.js";
export interface PreV27Checkpoint<C = SessionCheckpoint> {
    /** The checkpoint in v27's shape, without its session projection. */
    readonly checkpoint: C;
    /** Turns the earlier owner numbered: the next turn takes the next number. */
    readonly turnCount: number;
}
export type PreV27CheckpointImport = 
/** Its checkpoint still unchecked against the current shape. */
{
    readonly kind: "pre-v27";
    readonly imported: PreV27Checkpoint<Record<string, unknown>>;
}
/** Work the earlier owner runs will finish; a later delivery can move the session. */
 | {
    readonly kind: "busy";
    readonly detail: string;
} | {
    readonly kind: "incompatible";
    readonly detail: string;
};
export declare function isPreV27CheckpointVersion(version: unknown): version is number;
/**
 * Reads a pre-v27 checkpoint in v27's shape. Pure, so the session workflow can run it before
 * validation. The earlier owner only hands off an idle session; a task it still tracks keeps the
 * session on that owner.
 */
export declare function importPreV27Checkpoint(checkpoint: Readonly<Record<string, unknown>>): PreV27CheckpointImport;
/**
 * The projection of a session whose earlier lines a v27 writer never folded: it writes after
 * `tailIndex`, and its next turn follows the earlier owner's last. An empty stream has not opened.
 */
export declare function preV27Projection(tailIndex: number, turnCount: number): SessionProjection;
/** The imported checkpoint with its session projection. */
export declare function withProjection(checkpoint: SessionCheckpoint, projection: SessionProjection): SessionCheckpoint;
