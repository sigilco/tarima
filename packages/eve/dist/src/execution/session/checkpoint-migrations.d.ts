import { type SessionCheckpoint } from "#execution/session/handoff.js";
import { type PreV27Checkpoint } from "#execution/session/pre-v27-checkpoint.js";
/**
 * Oldest checkpoint a successor upgrades in place: the first that writes v27 session events.
 * Older ones, from an owner before v27, are imported instead (`pre-v27-checkpoint.ts`): their
 * stream's lines, projection, and private records of running work changed shape together, so the
 * successor also folds their stream before it continues.
 */
export declare const MIN_SESSION_CHECKPOINT_VERSION = 18;
export type SessionCheckpointMigration = {
    readonly kind: "current";
    readonly checkpoint: SessionCheckpoint;
}
/** A checkpoint from an owner before v27, still without the projection its stream holds. */
 | {
    readonly kind: "pre-v27";
    readonly imported: PreV27Checkpoint;
}
/** An owner before v27 still runs work for the session; a later delivery can move it. */
 | {
    readonly kind: "busy";
    readonly detail: string;
} | {
    readonly kind: "incompatible";
    readonly detail: string;
};
/**
 * Upgrades a checkpoint written by an older eve build to the current shape.
 * Pure, so the session workflow can run it before validation. Newer
 * checkpoints and those older than eve 0.69 are incompatible.
 */
export declare function migrateSessionCheckpoint(checkpoint: unknown): SessionCheckpointMigration;
