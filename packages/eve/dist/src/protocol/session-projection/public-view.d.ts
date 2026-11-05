import { type ReceivedEvent } from "./fold.js";
import * as selectors from "./selectors.js";
import { type Interaction } from "#protocol/session-projection/reader.js";
import type { Capability } from "#protocol/session-events/families/call.js";
import type { InteractionSubject } from "#protocol/session-events/families/interaction.js";
import type { ErrorInfo } from "#protocol/session-events/envelope.js";
import { type SessionView } from "./session-view.js";
import type { CallFilter, CallObservation, TurnObservation, DeliveryObservation, TaskObservation, RunObservation, ContentObservation, ChildObservation, SessionObservation, SessionUsage, CallPreviewObservation, ContentPreviewObservation, Activity, Waiting } from "./observations.js";
export type { SessionView } from "./session-view.js";
export type * from "./observations.js";
export type { ReceivedEvent } from "./fold.js";
export type { CallState } from "./selectors.js";
export type { RequestStatus } from "./request-status.js";
/** A new empty snapshot, without a mutable table representation. */
export declare function emptySessionView(): SessionView;
/** Returns a new snapshot; incomplete commits remain private until their last event arrives. */
export declare function foldEvents(view: SessionView, events: readonly ReceivedEvent[]): SessionView;
/** Durable position of the next line, not an event count. */
export declare function position(view: SessionView): number;
export declare function session(view: SessionView): SessionObservation;
export declare function turn(view: SessionView, turnId: string): TurnObservation | undefined;
/** Retained turns, in the order they started. */
export declare function turns(view: SessionView): readonly TurnObservation[];
export declare function activeTurn(view: SessionView): TurnObservation | undefined;
export declare function conversation(view: SessionView): readonly TurnObservation[];
export declare function call(view: SessionView, callId: string): CallObservation | undefined;
export declare function calls(view: SessionView, filter?: CallFilter): readonly CallObservation[];
export declare function callState(view: SessionView, callId: string): selectors.CallState | undefined;
/** A projected call already carries its display label; request facts may also be labelled. */
export declare function callLabel(value: CallObservation | {
    readonly capability: Capability;
    readonly label?: string;
    readonly status?: "requested" | "running" | "settled";
}, preview?: {
    readonly label?: string;
}): string;
export declare function callOutputSource(view: SessionView, callId: string): CallObservation | undefined;
export declare function interaction(view: SessionView, interactionId: string): Interaction | undefined;
export declare function interactions(view: SessionView): readonly Interaction[];
export declare function openInteractions(view: SessionView, filter?: {
    readonly kind?: string;
    readonly about?: InteractionSubject;
}): readonly Interaction[];
export declare function delivery(view: SessionView, deliveryId: string): DeliveryObservation | undefined;
export declare function deliveries(view: SessionView, filter?: {
    readonly turnId?: string;
}): readonly DeliveryObservation[];
export declare function queue(view: SessionView): readonly DeliveryObservation[];
export declare function task(view: SessionView, taskId: string): TaskObservation | undefined;
export declare function tasks(view: SessionView, filter?: {
    readonly status?: "working" | "idle" | "ended";
}): readonly TaskObservation[];
export declare function runs(view: SessionView, filter?: {
    readonly turnId?: string;
}): readonly RunObservation[];
export declare function part(view: SessionView, partId: string): ContentObservation | undefined;
export declare function parts(view: SessionView, filter?: {
    readonly runId?: string;
    readonly turnId?: string;
    readonly kind?: string;
}): readonly ContentObservation[];
export declare function reply(view: SessionView, turnId: string): readonly ContentObservation[];
export declare function children(view: SessionView): readonly ChildObservation[];
export declare function usage(view: SessionView): SessionUsage;
export declare function failure(view: SessionView, turnId?: string): ErrorInfo | undefined;
export declare function idle(view: SessionView): boolean;
export declare function waiting(view: SessionView, turnId: string): Waiting | undefined;
export declare function activity(view: SessionView, filter?: {
    readonly turnId?: string;
}): Activity;
export declare function callPreview(view: SessionView, callId: string): CallPreviewObservation | undefined;
export declare function contentPreviews(view: SessionView, filter?: {
    readonly runId?: string;
}): readonly ContentPreviewObservation[];
