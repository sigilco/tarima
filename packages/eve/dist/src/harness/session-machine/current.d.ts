import type { ContextReader } from "#context/key.js";
import type { HarnessSessionBase, SessionPublication, SessionStateMap } from "#harness/types.js";
import { type SessionProjection } from "#protocol/session-projection.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { StoredLine } from "#protocol/session-events/envelope.js";
import type { SessionView as PublicSessionView } from "#protocol/session-projection/tables.js";
export declare function enterSessionProjection(ctx: ContextReader, state: SessionStateMap | undefined): void;
/**
 * Enters a checkpointed projection directly, for a step that publishes without the session's
 * state, as the session's end does.
 */
export declare function enterSessionProjectionAt(ctx: ContextReader, projection: SessionProjection | undefined): void;
/** Enters the stored projection unless this step already did. */
export declare function ensureSessionProjection(ctx: ContextReader, state: SessionStateMap | undefined): void;
/**
 * The current step's projection, or `undefined` outside a session step, such as a workflow-step
 * tool, which runs without one.
 */
export declare function liveProjection(ctx?: ContextReader | undefined): SessionProjection | undefined;
/** The projection as of the last event the current step published. */
export declare function currentProjection(ctx?: ContextReader | undefined): SessionProjection;
/** The step's live projection, or the session's stored one when no step entered it. */
export declare function projectionFor(ctx: ContextReader, state: SessionStateMap | undefined): SessionProjection;
/** The position of the next line the step writes. */
export declare function nextLinePosition(ctx: ContextReader): number;
/**
 * Records that the step wrote one line at `position`: its commit folds into the public view, and
 * its events into what the view can't hold.
 */
export declare function recordPublishedLine(ctx: ContextReader, line: StoredLine, position: number, events: readonly SessionEvent[]): void;
/**
 * Checks a line a step folds itself, where no publisher checked it: a detached step's, or a test
 * sink's. Under the same switch as the publisher's checks, a violation fails the fold.
 */
export declare function checkFoldedLine(view: PublicSessionView, line: StoredLine, position: number): void;
/** The public view as of the last line the step wrote, if a step entered its projection. */
export declare function enteredView(ctx: ContextReader): PublicSessionView | undefined;
/** The projection after one line: its view, then what the view can't hold. */
export declare function advance(projection: SessionProjection, line: StoredLine, position: number, events: readonly SessionEvent[]): SessionProjection;
/** The public view as of the last line the step wrote. */
export declare function currentView(ctx?: ContextReader | undefined): PublicSessionView;
/** Records the session a transition the step published produced. */
export declare function recordAppliedSession(ctx: ContextReader, session: HarnessSessionBase): void;
/** The session the step's last applied transition produced, if it applied any. */
export declare function appliedSession<T extends HarnessSessionBase>(ctx: ContextReader): T | undefined;
export declare function saveSessionProjection<T extends HarnessSessionBase>(session: T, ctx: ContextReader): T;
/** The session saves the coordinates and public view its steps read. */
export declare function saveProjection<T extends HarnessSessionBase>(session: T, projection: SessionProjection): T;
/** The projection one step reads and folds what it publishes into. */
export interface StepProjection {
    read(): SessionProjection;
    /** Folds a publication no sink folded, preserving its commit boundaries. */
    record(publication: SessionPublication): void;
}
/** A step's projection: the context's live one, which the publish sink folds. */
export declare function stepProjection(ctx: ContextReader, state: SessionStateMap | undefined): StepProjection;
/** Folds a publication into the step's live projection, as the publish sink does. */
export declare function foldPublication(ctx: ContextReader, publication: SessionPublication): void;
